const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');
const {ensureAuthenticated} = require('../helpers/auth');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');
const dateFormat = require('dateformat');
const date = require('date-and-time');
const moment = require('moment');
const multer = require('multer');
const PdfPrinter = require('pdfmake');
const fs = require('fs');


// Method override middleware
router.use(methodOverride('_method'));

require('../models/Schedule');
require('../models/Users');
require('../models/Appointmet');
require('../models/Disease');
require('../models/TempDiagnosis');
require('../models/Report');
require('../models/Message');
const Users = mongoose.model('users');
const Schedule = mongoose.model('schedule');
const Appointmet = mongoose.model('appointment');
const TempDiagnosis = mongoose.model('tempDiagnosis');
const Disease = mongoose.model('disease');
const Report = mongoose.model('report');
const Message = mongoose.model('message');

app.use(express.static(path.join(__dirname, 'public')));
const {
  formatDate,
  formatDateSub
} = require('../helpers/hbs');


const dayArr=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];


router.post('/:userName/patientForm/:patId/:aptId',(req, res)=>{
  const userName=req.params.userName;
  const patientId=req.params.patId;
  const aptId=req.params.aptId; 

  const ovservation =req.body.info; 

  const symptom=req.body.symptom;
  const symptomDetails=req.body.symptomDetails;

  const medicine_name=req.body.medicine_name;
  const daily_dose=req.body.daily_dose;
  const description=req.body.description;

  const arrSymptom = [];
  var len=0;
  arrSymptom.push([{text: 'Symptom', style: 'tableHeader'}, {text: 'Duration/Complication', style: 'tableHeader'}]);

  if(Array.isArray(symptom)){
    len=symptom.length;
    for(var i=symptom.length-1;i>-1;i--){
      arrSymptom.push([{text: symptom[i], alignment: 'center'}, {text: symptomDetails[i],alignment: 'center'}]);
    }
  }
  else{
    len=1;
    arrSymptom.push([{text: symptom, alignment: 'center'}, {text: symptomDetails,alignment: 'center'}]);
  }
  
  const arrMedication = [];
  var Len=0;
  arrMedication.push([{text: 'Medicine Name', style: 'tableHeader'}, {text: 'Daily Dose', style: 'tableHeader'}, {text: 'Instructions/Description', style: 'tableHeader'}]);

  if(Array.isArray(medicine_name)){
    for(var i=medicine_name.length-1;i>-1;i--){
      Len=medicine_name.length;
      arrMedication.push([{text: medicine_name[i], alignment: 'center'}, {text: daily_dose[i], alignment: 'center'}, {text: description[i], alignment: 'center'}]);
    }
  }
  else{
    Len=1;
    arrMedication.push([{text: medicine_name, alignment: 'center'}, {text: daily_dose, alignment: 'center'}, {text: description, alignment: 'center'}]);
  }

  
  
  var fonts = {
    Courier: {
      normal: 'Courier',
      bold: 'Courier-Bold',
      italics: 'Courier-Oblique',
      bolditalics: 'Courier-BoldOblique'
    },
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    },
    Times: {
      normal: 'Times-Roman',
      bold: 'Times-Bold',
      italics: 'Times-Italic',
      bolditalics: 'Times-BoldItalic'
    }
  };
  const printer = new PdfPrinter(fonts);


  var docDefinition = {

    content: [
    {
      columns: [
      {
        width:'auto',
        image: 'public/images/logo.png',
        width: 35,
        height: 35,
        absolutePosition: {x:90, y:10}

      },
      {
        width:'*',
        text:'A Next Generation Advance Health Advice System',
        absolutePosition: {x:125, y:20},
        style:'header'
      },
      ] 
    },
    {
      text:'Medical Prescription',
      absolutePosition: {x:225, y:40},
      style:'subheader'
    },
    {
      text:'Doctor\'s Name:',
      absolutePosition: {x:45, y:120},
      style:'label'
    },
    {
      text:req.body.docName,
      absolutePosition: {x:225, y:120},
      style:'value'
    },
    {

      text:'Doctor\'s Address/Chamber:',
      absolutePosition: {x:45, y:145},
      style:'label'
    },
    {
      text:req.body.docAddress,
      absolutePosition: {x:225, y:145},
      style:'value'
    },
    {

      text:'Doctor\'s Email:',
      absolutePosition: {x:45, y:170},
      style:'label'
    },
    {
      text:req.body.docEmail,
      absolutePosition: {x:225, y:170},
      style:'value'
    },
    {

      text:'Doctor\'s Phone No.:',
      absolutePosition: {x:45, y:195},
      style:'label'
    },
    {
      text:req.body.docPhone,
      absolutePosition: {x:225, y:195},
      style:'value'
    },
    {
      text:'Patient\'s Name:',
      absolutePosition: {x:45, y:220},
      style:'label'
    },
    {
      text:req.body.patName,
      absolutePosition: {x:225, y:220},
      style:'value'
    },
    {
      text:'Patient\'s Gender:',
      absolutePosition: {x:45, y:245},
      style:'label'
    },
    {
      text:req.body.patGender,
      absolutePosition: {x:225, y:245},
      style:'value'
    },
    {
      text:'Possible Disease/Complication Name:',
      absolutePosition: {x:45, y:270},
      style:'label'
    },
    {
      text:req.body.diseaseName,
      absolutePosition: {x:225, y:270},
      style:'value'
    },
    {
      text:'Patient\'s Symptom',
      absolutePosition: {x:45, y:310},
      style:'label'
    },
    {
      table:{
        body:arrSymptom
      },
      absolutePosition: {x:135, y:330},
      layout: 'noBorders'
    },
    {
      text:'Medication Details',
      absolutePosition: {x:45, y:345+len*30},
      style:'label'
    },
    {
      table:{
        body:arrMedication
      },
      absolutePosition: {x:120, y:365+len*30},
      layout: 'noBorders'
    },
    {
      text:'Advice/Instructions to Patient:',
      absolutePosition: {x:45, y:450+Len*30},
      style:'label'
    },
    {
      text:req.body.info,
      absolutePosition: {x:225, y:450+Len*30},
      style:'value'
    },
    ],
    defaultStyle: {
      font: 'Helvetica'
    },
    styles:{
      header:{
        fontSize: 16,
        bold: true,
        font:'Times',
        color:'#12A98C'
      },
      subheader:{
        fontSize: 14,
        color:'#12A98C'
      },
      label:{
        fontSize:12,
        color:'#5DB4B8',
        italics:true,
        bold: true
      },
      tableHeader:{
        fontSize:12,
        color:'#85E9EE',
        italics:false,
        bold: true
      },
      value:{
        fontSize:12,
        color:'#000000',
        italics:false,
        bold: false
      }
    }
  };


  var pdfDoc = printer.createPdfKitDocument(docDefinition);
  pdfDoc.pipe(fs.createWriteStream('public/prescriptions/document.pdf'));
  pdfDoc.end();
  // Users.findOne({userName:userName}).then((user) =>{
  //   const report = new Report({
  //     aptId:aptId,
  //     patientId:patientId,
  //     docId:user._id,
  //     observation:ovservation
  //   });
  //   report.save().then((result)=>{
  //     res.redirect('/doctor/'+userName+'/patient')
  //   })
  // });  
});


router.get('/:userName', (req, res) => {
  const userName=req.params.userName;
  const navClass = ["current","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  Users.findOne({userName:userName}).then((user) => {
    Appointmet.find({$and:[{docId:user._id},{status:'pending'}]}).populate('docId').populate('patientId').exec().then(result => {
      res.render('doctor/doctorHome',{
        helpers : {
          formatDate:formatDate},
          layout:'mainDoc',
          userName:userName,
          image:user.profileImage,
          apts:result,
          navClass:navClass,
          title:'Home'
        });
    });
  });
});


router.get('/:userName/notification', (req, res) => {
  const navClass = ["sidebar-link","current","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    res.render('doctor/notification',{
      layout:'mainDoc',
      userName:userName,
      image:user.profileImage,
      navClass:navClass,
      title:'Notification'
    });
  })
});

router.get('/:userName/doctorProfile', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) => {
    const dob=dateFormat(user.dob, "isoDate");
    res.render('doctor/doctorProfile',{
     layout:'mainDoc',
     userName:userName,
     image:user.profileImage,
     user:user,
     dob:dob,
     navClass:navClass,
     title:'Profile'
   });
  });
});

router.get('/:userName/chat/:receiver',(req,res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    Message.find({$or:[{$and:[{senderName:req.params.userName},{receiverName:req.params.receiver}]},
      {$and:[{senderName:req.params.receiver},{receiverName:req.params.userName}]}]}).then((result)=>{
        res.render('doctor/chatUI',{
          layout:'mainDoc',
          userName:userName,
          image:user.profileImage,
          navClass:navClass,
          receiver:req.params.receiver,
          title:'Message',
          messages:result
        });
      });
    })
});

router.get('/:userName/videoChat',(req, res)=>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","current"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    res.render('doctor/videoChat',{
      layout:'mainPatient',
      userName:userName,
      image:user.profileImage,
      navClass:navClass,
      title:'Message'
    });
  })
});

router.get('/:userName/patient', (req, res) => {
  const userName=req.params.userName;
  const navClass = ["sidebar-link","sidebar-link","current","sidebar-link","sidebar-link"];
  Users.findOne({userName:userName}).then((user) => {
    Appointmet.find({$and:[{docId:user._id},{status:'done'}]}).populate('docId').populate('patientId').exec().then(result => {
      res.render('doctor/patientTable',{
        helpers : {
          formatDate:formatDate},
          layout:'mainDoc',
          userName:userName,
          image:user.profileImage,
          apts:result,
          navClass:navClass,
          title:'Patients'
        });
    });
  });

});


router.get('/:userName/appointment', (req, res) => {
  const userName=req.params.userName;
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","current","sidebar-link"];
  Users.findOne({userName:userName}).then((user) => {
    Appointmet.find({$and:[{docId:user._id},{status:'accepted'}]}).populate('docId').populate('patientId').exec().then(result => {
      res.render('doctor/appointmentTable',{
        helpers : {
          formatDate:formatDate},
          layout:'mainDoc',
          userName:userName,
          image:user.profileImage,
          apts:result,
          navClass:navClass,
          title:'Appointmets'
        });
    });
  });

});


router.get('/:userName/schedule', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    Schedule.findOne({doctorId:user._id}).then((doctor)=>{

      res.render('doctor/docSchedule',{
        layout:'mainDoc',
        userName:userName,
        image:user.profileImage,
        schedule:doctor,
        navClass:navClass,
        title:'Schedule'
      });
    });
  });
});


router.get('/:userName/viewPatient/:aptId', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  const patient=req.params.patientId;
  const aptId=req.params.aptId;
  Users.findOne({userName:userName}).then((user)=>{
    Appointmet.findOne({_id:aptId}).populate('docId').populate('patientId').exec().then(result => {
      res.render('doctor/viewPatient',{
        helpers : {
          formatDate:formatDate},
          layout:'mainDoc',
          userName:userName,
          image:user.profileImage,
          apt:result,
          navClass:navClass,
          title:'Patient Appointmet'
        });
    });
  })
});


router.get('/:userName/acceptPatient/:aptId', (req, res) => {
  const aptId=req.params.aptId;
  const userName=req.params.userName;
  Appointmet.findById({_id:aptId}).then(result=>{
    result.status = 'accepted';
    result.save().then((r)=>{
      res.redirect('/doctor/'+userName);
    })
  })

});


router.get('/:userName/rejectPatient/:patId/:aptId', (req, res) => {
  const userName=req.params.userName;
  const aptId=req.params.aptId;
  Appointmet.findById({_id:aptId}).then(result=>{
    result.status = 'rejected';
    result.save().then((r)=>{
      res.redirect('/doctor/'+userName);
    });
  });
});


router.get('/:userName/patientForm/:patId/:aptId',(req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  const patientId=req.params.patientId;
  Users.findOne({userName:userName}).then((user) => {
    Appointmet.findOne({_id:req.params.aptId}).populate('docId').populate('patientId').exec().then(result => {
      res.render('doctor/patientForm',{
        layout:'mainDoc',
        userName:userName,
        image:user.profileImage,
        apt:result,
        navClass:navClass,
        title:'Report'
      });
    });
  });
});




router.get('/:userName/editDoctorProfile', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user=>{
    const dob=dateFormat(user.dob, "isoDate");
    res.render('doctor/editDoctorProfile',{
     layout:'mainDoc',
     userName:userName,
     image:user.profileImage,
     user:user,
     dob:dob,
     navClass:navClass,
     title:'Edit Profile'
   });
  }));
});


router.put('/:userName/editDoctorProfile',(req, res) =>{
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) =>{
    user.name = req.body.name;
    user.email = req.body.email;
    user.contact = req.body.contact;
    user.chamber = req.body.chamber;
    user.degree = req.body.degree;
    user.education = req.body.education;
    user.speciality = req.body.speciality;
    user.save().then((user) =>{
      res.redirect('/doctor/'+user.userName+'/doctorProfile');
    })
  })
});


router.get('/:userName/changePassword', (req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user=>{
    res.render('doctor/changePassword',{
      layout:'mainDoc',
      userName:userName,
      image:user.profileImage,
      user:user,
      navClass:navClass,
      title:'Change Password'
    })
  }));
});


router.put('/:userName/changePassword', (req, res) =>{
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user =>{
    bcrypt.compare(req.body.currentPassword, user.password, function(err, result) {
      if(result){
        if(req.body.newPassword==req.body.newPasswordCheck){
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.newPassword, salt, (err, hash) => {
              if(err) throw err;
              user.password = hash;
              user.save().then((user) =>{
                res.redirect('/doctor/'+user.userName);
              });
            });
          });
        }
      }
    });

  }));
});


router.get('/:userName/doctorMail', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user)=>{
    res.render('doctor/doctorMail',{
      layout:'mainDoc',
      userName:userName,
      image:user.profileImage,
      navClass:navClass,
      title:'Mail'
    });
  })
});

router.get('/:userName/editSchedule', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user =>{
    Schedule.findOne({doctorId:user._id}).then((schedule ) =>{
      res.render('doctor/editSchedule',{
        layout:'mainDoc',
        userName:userName,
        schedule:schedule ,
        image:user.profileImage,
        navClass:navClass,
        title:'Edit Schedule'
      });
    });
  }));
});


router.put('/:userName/editSchedule',(req, res) => {
  const userName=req.params.userName;
  const satStart=req.body.satStart;
  const satEnd=req.body.satEnd;

  const sunStart=req.body.sunStart;
  const sunEnd=req.body.sunEnd;

  const monStart=req.body.monStart;
  const monEnd=req.body.monEnd;

  const tueStart=req.body.tueStart;
  const tueEnd=req.body.tueEnd;

  const wedStart=req.body.wedStart;
  const wedEnd=req.body.wedEnd;

  const thurStart=req.body.thurStart;
  const thurEnd=req.body.thurEnd;

  const friStart=req.body.friStart;
  const friEnd=req.body.friEnd;
  


  Users.findOne({userName:userName}).then((user) => {
    Schedule.findOne({doctorId:user._id}).then((result) => {
      if(result){
        result.start = [];
        result.end = [];
        result.slot =[];
        result.start.push(satStart,sunStart,monStart,tueStart,wedStart,thurStart,friStart);
        result.end.push(satEnd,sunEnd,monEnd,tueEnd,wedEnd,thurEnd,friEnd);

        const satSlot = [];
        if(satStart && satEnd){
          const arr=calCulateSlot(satStart,satEnd);
          for(let i=0;i<arr.length;i++){satSlot.push(arr[i]);}
        }
      result.slot.push(satSlot);

      const sunSlot = [];
      if(sunStart && sunEnd){
        const arr=calCulateSlot(sunStart,sunEnd);
        for(let i=0;i<arr.length;i++){sunSlot.push(arr[i]);}
      }
    result.slot.push(sunSlot);

    const monSlot =[];
    if(monStart && monEnd){
      const arr=calCulateSlot(monStart,monEnd);
      for(let i=0;i<arr.length;i++){monSlot.push(arr[i]);}
    }
  result.slot.push(monSlot);

  const tueSlot =[];
  if(tueStart && tueEnd){
    const arr=calCulateSlot(tueStart,tueEnd);
    for(let i=0;i<arr.length;i++){tueSlot.push(arr[i]);}
  }
result.slot.push(tueSlot);

const wedSlot =[];
if(wedStart && wedEnd){
  const arr=calCulateSlot(wedStart,wedEnd);
  for(let i=0;i<arr.length;i++){wedSlot.push(arr[i]);}
}
result.slot.push(wedSlot);

const thurSlot =[];
if(thurStart && thurEnd){
  const arr=calCulateSlot(thurStart,thurEnd);
  for(let i=0;i<arr.length;i++){thurSlot.push(arr[i]);}
}
result.slot.push(thurSlot);

const friSlot =[];
if(friStart && friEnd){
  const arr=calCulateSlot(friStart,friEnd);
  for(let i=0;i<arr.length;i++){friSlot.push(arr[i]);}
}
result.slot.push(friSlot);
result.save().then((r) => {
  res.redirect('/doctor/'+userName+'/schedule');
});
        }//end if
        else{
          const newSchedule = new Schedule({
            doctorId : user._id,

            start:[
            satStart,sunStart,monStart,tueStart,wedStart,thurStart,friStart
            ],
            end:[
            satEnd,sunEnd,monEnd,tueEnd,wedEnd,thurEnd,friEnd
            ],

            slot:[
            calCulateSlot(satStart,satEnd),
            calCulateSlot(sunStart,sunEnd),
            calCulateSlot(monStart,monEnd),
            calCulateSlot(tueStart,tueEnd),
            calCulateSlot(wedStart,wedEnd),
            calCulateSlot(thurStart,thurEnd),
            calCulateSlot(friStart,friEnd),
            ],
            day:["0","1","2","3","4","5","6"]
          });
          newSchedule.save().then((r)=>{
            res.redirect('/doctor/'+userName+'/schedule');
          });
        }//end else
      });
  });
  
});

//Will show Slots of a Particular Day
router.get('/:userName/showSlot/:dayNo',(req,res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const timeObj = [];
  const userName=req.params.userName;
  const dayNo=req.params.dayNo;
  var tempTime;
  Users.findOne({userName:userName}).then((user) =>{
    Schedule.findOne({doctorId:user._id}).then((schedule) =>{
      tempTime=schedule.start[dayNo];
      const len=schedule.slot[dayNo].length;
      for(let i=0;i<len;i++){
        const tempArr=addThirtyMin(tempTime);
        tempTime=tempArr[1];
        const status = schedule.slot[dayNo][i];
        let condition;
        if(status == 0)condition = 'Free'
          else if(status == 1)condition = 'Booked'
            timeObj.push({start:tempArr[0],end:tempArr[1],status:condition})
        }
        res.render('doctor/docScheduleSlot',{
          layout:'mainDoc',
          userName:userName,
          day:dayArr[dayNo],
          timeObj:timeObj,
          image:user.profileImage,
          navClass:navClass,
          title:'Schedule Slot'
        });
      });
  });
});

//Calculate Number of Slot
function calCulateSlot(start,end){
  const s=start.split(":");
  const e=end.split(":");
  var i1=Number(s[0]*60)+Number(s[1]);
  var i2=Number(e[0]*60)+Number(e[1]);
  const arr=[];
  if(i1<i2)for(let i=i1;i<i2;i=i+30)arr.push(0);
  else{
    i2=i2+24*60;
    for(let i=i1;i<i2;i=i+30)arr.push(0);
  }
return arr;

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


module.exports = router;