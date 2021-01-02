const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');
const {ensureAuthenticated} = require('../helpers/auth');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const dateFormat = require('dateformat');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const nodemailer = require('nodemailer');


// Method override middleware
router.use(methodOverride('_method'));

require('../models/Schedule');
require('../models/Users');
require('../models/Appointmet');
require('../models/Disease');
require('../models/TempDiagnosis');
require('../models/Report');
require('../models/Message');
require('../models/DetailDisease');
const Users = mongoose.model('users');
const Schedule = mongoose.model('schedule');
const Appointmet = mongoose.model('appointment');
const TempDiagnosis = mongoose.model('tempDiagnosis');
const Disease = mongoose.model('disease');
const Report = mongoose.model('report');
const Message = mongoose.model('message');
const DiseaseInfo = mongoose.model('detaildisease');

const dayArr=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const {
  formatDate,
  formatDateSub
} = require('../helpers/hbs');




//Patient Home Route
router.get('/:userName',(req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((users) =>{
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      res.render('patient/patientHome',{
        layout:'mainPatient',
        userName:userName,
        id:users._id,
        friendRequest:friendRequest,
        image:users.profileImage,
        user:users,
        navClass:navClass,
        title:'Home Page'
      });
    })
  });
});


router.get('/:userName/notification', (req, res) => {
  const navClass = ["current","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      res.render('patient/notification',{
        layout:'mainPatient',
        userName:userName,
        id:user._id,
        friendRequest:friendRequest,
        image:user.profileImage,
        navClass:navClass,
        title:'Notification'
      });
    })
  })
});

router.get('/:userName/symptompChecker',(req, res) => {
  const navClass = ["sidebar-link","current","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      res.render('patient/symptompChecker',{
        layout:'mainPatient',
        userName:userName,
        id:user._id,
        friendRequest:friendRequest,
        image:user.profileImage,
        navClass:navClass,
        title:'Symptom Checker'
      });
    })
  });
});

router.post('/:userName/symptompChecker', (req, res) => {
  let obj = JSON.parse(JSON.stringify(req.body))
  const arr=req.body.arr;
  const userName=req.params.userName;
  let topMatch =[];


  Users.findOne({userName:req.params.userName}).then(user =>{
    TempDiagnosis.find({patientId:user._id}).then((report)=>{
      report.forEach(rpt=>{
        rpt.remove()
      });
    });
  })
  Users.findOne({userName:req.params.userName}).then((user) => {
    var matchObj =[];
    Disease.find().then(diseases =>{
      diseases.forEach(disease =>{
        const arrLen = disease.symptom.length;
        var match =0;
        for (var i = 0; i < arrLen;i++){
          for (var j = 0; j < arr.length;j++){
            if(disease.symptom[i] == arr[j])match++;
          }
        }
        var Res=0;
        if(match>0)Res=(match/arrLen)*100;
        Res = Math.floor(Res)
        const obj={
          diseaseName:disease.name,
          matchPercent:Res,
          docType:disease.docType
        }
        matchObj.push(obj);
      });
      const tempDiagnosis =new TempDiagnosis({
        patientId:user._id,
        matching:matchObj.sort((x, y) => y.matchPercent - x.matchPercent),
        symptoms:arr
      });
      tempDiagnosis.save();
      topMatch = findExpectedMatch(matchObj);
      res.send(topMatch);
    });
  });
});


router.get('/:userName/chat',(req, res)=>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","current","sidebar-link"];
  const userName=req.params.userName;
  const search=req.query.search;
  Users.findOne({userName:userName}).then((user)=>{
    Users.findOne({userName:userName}).populate('request.userId').populate('friendList.friendId').exec().then((friendRequest)=>{
      Users.find({role:'doctor'}).then((users) => {
        res.render('patient/chat',{
          layout:'mainPatient',
          userName:userName,
          id:user._id,
          friendRequest:friendRequest,
          friendList:friendRequest.friendList,
          doctors:users,
          image:user.profileImage,
          navClass:navClass,
          title:'Message'
        });
      });
    })
  })
});

router.get('/:userName/chat/:receiver',(req, res)=>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    Users.findOne({userName:userName}).populate('request.userId').populate('friendList.friendId').exec().then((friendRequest)=>{
     Message.find({$or:[{$and:[{senderName:req.params.userName},{receiverName:req.params.receiver}]},
      {$and:[{senderName:req.params.receiver},{receiverName:req.params.userName}]}]}).populate('receiver').populate('sender').exec().then((result)=>{
        Users.find({role:'doctor'}).then((users) => {
          res.render('patient/chatUI',{
            layout:'mainPatient',
            userName:userName,
            id:user._id,
            friendRequest:friendRequest,
            friendList:friendRequest.friendList,
            navClass:navClass,
            image:user.profileImage,
            receiver:req.params.receiver,
            title:'Message',
            messages:result
          });
        });
      });
    });
  })
});

router.get('/:userName/videoChat',(req, res)=>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","current"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) => {
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      res.render('patient/videoChat',{
        layout:'mainPatient',
        userName:userName,
        id:user._id,
        friendRequest:friendRequest,
        image:user.profileImage,
        navClass:navClass,
        title:'Message'
      });
    });
  })
});


//show all doctors
router.get('/:userName/doctors', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","current","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  const search=req.query.search;
  if(search == undefined){
    Users.findOne({userName:userName}).then((user) => {
      Users.find({role:'doctor'}).then((users) => {
        Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
          res.render('patient/doctors',{
            layout:'mainPatient',
            userName:userName,
            friendRequest:friendRequest,
            doctors:users,
            image:user.profileImage,
            navClass:navClass,
            title:'Doctors'
          });
        });
      })
    })
  }else{
    const regex = new RegExp(escapeRegex(search),'gi');
    Users.findOne({userName:userName}).then((user) => {
      Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
       Users.find({$and:[{$or:[{userName:regex},{email:regex},{name:regex}]},{role:'doctor'}]}).then((users) => {
        res.render('patient/doctors',{
          layout:'mainPatient',
          userName:userName,
          id:user._id,
          friendRequest:friendRequest,
          doctors:users,
          image:user.profileImage,
          navClass:navClass,
          title:'Doctors'
        });
      });
     });
    });
  }
});

router.get('/:userName/autocomplete', (req,res,next) => {
  var regex= new RegExp(req.query["term"],'i');
  Users.find({$and:[{name:regex},{role:'doctor'}]}).then((users) => {

    var result=[];
    users.forEach(user=>{
     let obj={
       id:user._id,
       label: user.name
     };
     result.push(obj);
   });
    res.jsonp(result);
  });
});

//Routing for Show medical history of patient
router.get('/:userName/report',(req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","current","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) => {
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      Appointmet.find({$and:[{patientId:user._id},{status:'done'}]}).populate('docId').populate('patientId').exec().then(result => {
        res.render('patient/medicalRecord',{
          helpers : {
            formatDate:formatDate},
            layout:'mainPatient',
            userName:userName,
            id:user._id,
            friendRequest:friendRequest,
            image:user.profileImage,
            navClass:navClass,
            apts:result,
            title:'Medical History'
          });
      })
    });
  });
});

//Routing for Showing report from a  doctor
router.get('/:userName/report/:aptId',(req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","current","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) => {
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      Report.findOne({aptId:req.params.aptId}).populate('docId').populate('patientId').exec().then(result => {
        res.render('patient/prescription',{
          helpers : {
            formatDate:formatDate},
            layout:'mainPatient',
            friendRequest:friendRequest,
            image:user.profileImage,
            userName:userName,
            id:user._id,
            navClass:navClass,
            report:result,
            title:'Report'
          });
      })
    });
  });
});




router.get('/:userName/diagnosisRes', (req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName }).then((user) => {
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      TempDiagnosis.findOne({patientId:user._id }).sort({'matching.matchPercent':'asc'}).then((rpt)=>{
        const diagnosis =[];
        diagnosis.push(rpt.matching[0],rpt.matching[1],rpt.matching[2],rpt.matching[3]);
        res.render('patient/symptomRes',{
          layout:'mainPatient',
          userName:userName,
          id:user._id,
          diagnosis:diagnosis,
          friendRequest:friendRequest,
          image:user.profileImage,
          navClass:navClass,
          title:'Symptom Checker Result'
        });
      })
    });
  });

});

router.get('/:userName/disease/:diseaseName',(req, res)=>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const diseaseName=req.params.diseaseName.replace('%20',' ');
  Users.findOne({userName:userName}).then((user)=>{
    DiseaseInfo.findOne({diseaseName:diseaseName}).then((disease) =>{
      Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
        res.render('patient/diseaseInfo',{
          layout:'mainPatient',
          userName:req.params.userName,
          id:user._id,
          friendRequest:friendRequest,
          navClass:navClass,
          image:user.profileImage,
          info:disease,
          title:diseaseName
        });
      });
    })
  })
});


router.get('/:userName/patientProfile',(req, res) => {
  const userName=req.params.userName;
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  Users.findOne({userName:userName}).then((users) =>{
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      const dob=dateFormat(users.dob, "isoDate");
      res.render('patient/patientProfile',{
        layout:'mainPatient',
        userName:userName,
        id:users._id,
        friendRequest:friendRequest,
        user:users,
        dob:dob,
        image:users.profileImage,
        navClass:navClass,
        title:'Profile'
      });
    });
  })
});



router.get('/:userName/viewDocProfile/:id', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  const id=req.params.id;
  Users.findOne({userName:userName}).then((usr)=>{
    Users.findOne({_id:req.params.id}).then((user) => {
      Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
        Schedule.findOne({doctorId:user._id}).then((schedule) => {
          res.render('patient/viewDocProfile',{
            layout:'mainPatient',
            userName:userName,
            doctor:user,
            image:usr.profileImage,
            schedule:schedule,
            navClass:navClass,
            name:usr.name,
            id:usr._id,
            title:'Doctor Profile'
          });
        })
      })
    });
  })
});


router.get('/:userName/editPatientProfile',(req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) => {
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      const dob=dateFormat(user.dob, "isoDate");
      res.render('patient/editPatientProfile',{
        layout:'mainPatient',
        userName:userName,
        id:user._id,
        image:user.profileImage,
        user:user,
        dob:dob,
        navClass:navClass,
        title:'Edit Profile'
      });
    })
  })
});

router.put('/:userName/editPatientProfile' ,(req, res) =>{
  const userName=req.params.userName;

  Users.findOne({userName:userName}).then((user) =>{
    user.name = req.body.name;
    user.email = req.body.email;
    user.contact = req.body.contact;
    user.dob = req.body.dob;
    user.save().then((user) =>{
      res.redirect('/patient/'+user.userName+'/patientProfile');
    })
  })
});



router.get('/:userName/changePassword', (req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user=>{
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      res.render('patient/changePassword',{
        layout:'mainPatient',
        userName:userName,
        id:user._id,
        image:user.profileImage,
        user:user,
        navClass:navClass,
        title:'Change Password'

      })
    })
  }));
});


router.put('/:userName/changePassword', (req, res) =>{
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then(user =>{
    bcrypt.compare(req.body.currentPassword, user.password, function(err, result) {
      if(result){
        if(req.body.newPassword==req.body.newPasswordCheck){
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.newPassword, salt, (err, hash) => {
              if(err) throw err;
              user.password = hash;
              user.save().then((user) =>{
                res.redirect('/patient/'+user.userName);
              });
            });
          });
        }
      }
    });
  });
});




//routing for appointments by slot
router.get('/:userName/makeAppointment/:doc/:dayNo', (req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  const timeObj = [];
  const docId=req.params.doc;
  const dayNo=req.params.dayNo;
  var tempTime;
  Users.findOne({userName:userName}).then(user=>{
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      Schedule.findOne({doctorId:docId}).then((schedule)=>{
        tempTime=schedule.start[dayNo];
        for(let i=0;i<schedule.slot[dayNo].length;i++){
          const tempArr=addThirtyMin(tempTime);
          tempTime=tempArr[1];
          const status = schedule.slot[dayNo][i];
          let condition;
          if(status == 0)condition = 'Free'
            else if(status == 1)condition = 'Booked'
              timeObj.push({start:tempArr[0],end:tempArr[1],status:condition,dayNo:dayNo})
          }
          res.render('patient/viewScheduleBySlot',{
            layout:'mainPatient',
            userName:userName,
            id:user._id,
            image:user.profileImage,
            day:dayArr[dayNo],
            timeObj:timeObj,
            user:user,
            navClass:navClass,
            docId:docId,
            title:'Schedule'
          });
        });
    })
  });
});

//routing for appointments booking by slot
router.get('/:userName/makeAppointment/:doc/:dayNo/:slot',(req, res) => {
  const patient=req.params.userName;
  const docID = req.params.doc;
  const dayNo=req.params.dayNo;
  const slot=req.params.slot;
  var type,message;
  let nextDay = (Number(dayNo)+6-1)%6;
  if(dayNo == 0)nextDay = 6;
  Users.findOne({userName:patient}).then((user) => {
    Schedule.findOne({doctorId:docID}).then((schedule) => {
      const slotNo=slot;
      const start=schedule.start[dayNo];
      const time=start.split(':');
      var i1=Number(time[0]*60)+Number(time[1]);
      for(var j=0; j<slotNo; j++)i1=i1+30;
        const div=Math.floor(i1/60);
      const rem=i1%60;
      let s1,s2,startTime;
      if(div<10)s1='0'+String(div);
      if(div>=10 && div<24)s1=String(div);
      if(div>=24)s1=String("00");
      if(rem==0)s2=String("00")
        if(rem>0)s2=String(rem);
      startTime=s1+":"+s2;
      var thisDate=returnDate(nextDay,startTime);

      Appointmet.findOne({$and:[{patientId:user._id},{appointmentDate
        :thisDate}]}).then(apt=>{
          if(apt){
            req.session.message ={
              type:'danger',
              msg:'You have another appointment at this time'
            }
            res.redirect('/patient/'+patient+'/viewDocProfile/'+docID);
          }
          else{
            schedule.slot.set(dayNo,changeSlotToOne(schedule.slot[dayNo],slotNo));
            schedule.save();
            createAppointment(nextDay,startTime,docID,user._id,schedule._id,'regular',slotNo,'pending', dayNo);
            res.redirect('/patient/'+patient+'/appointment/'+thisDate);
          }
        });
      });
  });
});

router.get('/:userName/appointment/:date',(req, res)=>{
  const appointmentDate = req.params.date.replace('%20',' ');
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName = req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    Users.findOne({userName:userName}).populate('request.userId').exec().then((friendRequest)=>{
      Appointmet.findOne({$and:[{patientId:user._id},{appointmentDate
        :appointmentDate}]}).populate('patientId').populate('docId').then((apt)=>{
          const thisdate=apt.appointmentDate;
          res.render('patient/appointment',{
            layout:'mainPatient',
            userName:userName,
            id:user._id,
            image:user.profileImage,
            navClass:navClass,
            aptdate:moment(thisdate).format('LLL'),
            title:'Appointmet',
            apt:apt
          });
        });
      });
  });
});
router.post('/:userName/appointment/:id',(req, res)=>{
  const symptom=req.body.symptom;
  const medication=req.body.medication;
  Appointmet.findOne({_id:req.params.id}).then((appointment)=>{
    appointment.symptoms=symptom;
    appointment.medication=medication;
    appointment.save().then((result)=>{
      req.session.message ={
        type:'success',
        msg:'Appointmet scheduled on '+moment(appointment.appointmentDate).format('LLL')
      }
      res.redirect('/patient/'+req.params.userName);

    });
  });
});

router.post('/:userName/symptompChecklast', (req, res)=>{
  const AsthmaQ1=req.body.AsthmaQ1;
  const AsthmaQ2=req.body.AsthmaQ2;
  const Acute_bronchitisQ1=req.body.Acute_bronchitisQ1;
  const AllergyQ1=req.body.AllergyQ1;
  const AnthraxQ1=req.body.AnthraxQ1;
  const Acute_liver_failureQ1=req.body.Acute_liver_failureQ1;
  const Acute_liver_failureQ2=req.body.Acute_liver_failureQ2;
  const Chronic_coughQ1=req.body.Chronic_coughQ1;
  const Chronic_coughQ2=req.body.Chronic_coughQ2;
  const ConcussionQ1=req.body.ConcussionQ1;
  const MalariaQ1=req.body.MalariaQ1;
  const Lung_AbscessQ1=req.body.Lung_AbscessQ1;
  const PneumoniaQ1=req.body.PneumoniaQ1;
  const PneumoniaQ2=req.body.PneumoniaQ2;
  const LeukemiaQ1=req.body.LeukemiaQ1;
  const LeukemiaQ2=req.body.LeukemiaQ2;
  const GastritisQ1=req.body.GastritisQ1;
  const GastritisQ2=req.body.GastritisQ2;
  const DengueQ1=req.body.DengueQ1;
  const DengueQ2=req.body.DengueQ2;

  let Asthma=0;
  if(AsthmaQ1 =='yes' && AsthmaQ2 =='yes')Asthma=1;
  else if((AsthmaQ1 =='yes' && AsthmaQ2 =='no')||(AsthmaQ1 =='no' && AsthmaQ2 =='yes'))Asthma=.5;

  let Bronchitis=0;
  if(Acute_bronchitisQ1 =='yes')Bronchitis=1;

  let Allergy=0;
  if(AllergyQ1 =='yes')Allergy=1;

  let Anthrax=0;
  if(AnthraxQ1 =='yes')Anthrax=1;

  let LiverFailure=0;
  if(Acute_liver_failureQ1 =='yes' && Acute_liver_failureQ2 =='yes')LiverFailure=1;
  else if((Acute_liver_failureQ1 =='yes' && Acute_liver_failureQ2 =='no')||(Acute_liver_failureQ1 =='no' && Acute_liver_failureQ2 =='yes'))LiverFailure=.5;

  let ChronicCough=0;
  if(Chronic_coughQ1 =='yes' && Chronic_coughQ2 =='yes')ChronicCough=1;
  else if((Chronic_coughQ1 =='yes' && Chronic_coughQ2 =='no')||(Chronic_coughQ1 =='no' && Chronic_coughQ2 =='yes'))ChronicCough=.5;

  let Concussion=0;
  if(ConcussionQ1 =='yes')Concussion=1;

  let Malaria=0;
  if(MalariaQ1 =='yes')Malaria=1;

  let LungAbscess=0;
  if(Lung_AbscessQ1 =='yes')LungAbscess=1;

  let Pneumonia =0;
  if(PneumoniaQ1 =='yes' && PneumoniaQ2 =='yes')Pneumonia=1;
  else if((PneumoniaQ1 =='yes' && PneumoniaQ2 =='no')||(PneumoniaQ1 =='no' && PneumoniaQ2 =='yes'))Pneumonia=.5;

  let Leukemia=0;
  if(LeukemiaQ1 =='yes' && LeukemiaQ2 =='yes')Leukemia=1;
  else if((LeukemiaQ1 =='yes' && LeukemiaQ2 =='no')||(LeukemiaQ1 =='no' && LeukemiaQ2 =='yes'))Leukemia=.5;

  let Gastritis=0;
  if(GastritisQ1 =='yes' && GastritisQ2 =='yes')Gastritis=1;
  else if((GastritisQ1 =='yes' && GastritisQ2 =='no')||(GastritisQ1 =='no' && GastritisQ2 =='yes'))Gastritis=.5;

  let Dengue=0;
  if(DengueQ1 =='yes' && DengueQ2 =='yes')Dengue=1;
  else if((DengueQ1 =='yes' && DengueQ2 =='no')||(DengueQ1 =='no' && DengueQ2 =='yes'))Dengue=.5;
  Users.findOne({userName:req.params.userName}).then(user =>{
    TempDiagnosis.findOne({patientId:user._id}).then((report)=>{
      report.matching.forEach(match=>{
        if(match.diseaseName=='Asthma'){
          const temp1=match.matchPercent*.80+Asthma*.20;
          match.matchPercent=temp1;
        }
        if(match.diseaseName=='Acute Bronchitis'){
          const temp2=match.matchPercent*.80+Bronchitis*.20;
          match.matchPercent=temp2;
        }
        if(match.diseaseName=='Allergy(Hay Fever)'){
          const temp3=match.matchPercent*.80+Allergy*.20;
          match.matchPercent=temp3;
        }
        if(match.diseaseName=='Anthrax'){
          const temp4=match.matchPercent*.80+Anthrax*.20;
          match.matchPercent=temp4;
        }
        if(match.diseaseName=='Acute liver failure'){
          const temp5=match.matchPercent*.75+LiverFailure*.25;
          match.matchPercent=temp5;
        }
        if(match.diseaseName=='Chronic cough'){
          const temp6=match.matchPercent*.80+ChronicCough*.20;
          match.matchPercent=temp6;
        }
        if(match.diseaseName=='Concussion'){
          const temp7=match.matchPercent*.80+Concussion*.20;
          match.matchPercent=temp7;
        }
        if(match.diseaseName=='Malaria'){
          const temp8=match.matchPercent*.80+Malaria*.20;
          match.matchPercent=temp8;
        }
        if(match.diseaseName=='Lung Abscess'){
          const temp9=match.matchPercent*.80+LungAbscess*.20;
          match.matchPercent=temp9;
        }
        if(match.diseaseName=='Pneumonia'){
          const temp10=match.matchPercent*.80+Pneumonia*.20;
          match.matchPercent=temp10;
        }
        if(match.diseaseName=='Leukemia'){
          const temp11=match.matchPercent*.75+Leukemia*.25;
          match.matchPercent=temp11;
        }
        if(match.diseaseName=='Gastritis'){
          const temp12=match.matchPercent*.70+Gastritis*.30;
          match.matchPercent=temp12;
        }
        if(match.diseaseName=='Dengue'){
          const temp13=match.matchPercent*.80+Dengue*.20;
          match.matchPercent=temp13;
        }
      })
      report.save().then((result)=>{
        res.redirect('/patient/'+req.params.userName+'/diagnosisRes');
      });
    });
  });
});




//create Appointment and save to MongoDB
function createAppointment(datNo,stime,docId,patientId,scheduleId,type,slotNo,status, dayNo){
  const d = new Date();
  d.setDate(d.getDate() + (datNo - 1 - d.getDay() + 7) % 7 + 1);
  const year=d.getFullYear();
  const month=d.getMonth();
  const day=d.getDate();
  const str=stime;
  const time=str.split(":");
  const date = new Date(year, month, day, time[0], time[1]);
  const newAppointment = new Appointmet(
  {
    docId:docId,
    patientId:patientId,
    scheduleId:scheduleId,
    appointmentType:type,
    appointmentDate:date,
    appointmentEnd:findEndTime(date),
    slotNo:slotNo,
    status:status,
    dayNo: dayNo
  });
  newAppointment.save();

}

function findEndTime(date){
  return moment(new Date(date)).add(30, 'm').toDate();
}

function setDate(datNo,stime){
  const d = new Date();
  d.setDate(d.getDate() + (datNo - 1 - d.getDay() + 7) % 7 + 1);
  const year=d.getFullYear();
  const month=d.getMonth();
  const day=d.getDate();
  const str=stime;
  const time=str.split(":");
  const date = new Date(year, month, day, time[0], time[1]);
  return date;
}

function changeSlotToOne(slotArr,changeSlot){
  slotArr[changeSlot] = 1;
  return slotArr;
}

//Parameter will be a string(12:30/HH:MM) and will return two string inverval Ex:12:30,13:00
function addThirtyMin(str){
  const start=str.split(':');
  const minS=Number(start[0]*60)+Number(start[1]);
  const minE=minS+30;
  return [minToStrTime(minS),minToStrTime(minE)];
}

//Parameter will be  minutes in number and will return HH:MM formatted string
function minToStrTime(min){
  const div=Math.floor(min/60);
  const rem=min%60;
  let s1,s2,time;
  if(div<10)s1='0'+String(div);
  if(div>=10)s1=String(div);
  if(div>=24)s1=String("00");
  if(rem==0)s2=String("00");
  if(rem>0)s2=String(rem);
  time=s1+":"+s2;
  return time;
}

//Function to Send Email
function sendEmailFunc(sender,password,receiver,subject,message){
  var flag;
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false,
    auth: {
      user: sender,
      pass: password
    },
    tls: { rejectUnauthorized: false }
  });


  let mailOptions = {
    from: sender,
    to: receiver,
    subject: subject,
    html: message
  };


  transporter.sendMail(mailOptions, (err, data) => {
    if (err) {
    }
    else {
    }
    done();
  });
  return flag;
}

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function findExpectedMatch(matchObj){
  const tempArr=matchObj.sort((x, y) => x.matchPercent - y.matchPercent);
  const arr=[];
  let tempObj;
  for(let i=0;i<4;i++){
    tempObj=tempArr.pop();
    arr.push(tempObj.diseaseName);
  }
  return arr;
}

function returnDate(datNo,stime){
  const d = new Date();
  d.setDate(d.getDate() + (datNo - 1 - d.getDay() + 7) % 7 + 1);
  const year=d.getFullYear();
  const month=d.getMonth();
  const day=d.getDate();
  const str=stime;
  const time=str.split(":");
  const date = new Date(year, month, day, time[0], time[1]);
  return date;
}

module.exports = router;
