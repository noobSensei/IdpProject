const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');
const {ensureAuthenticated} = require('../helpers/auth');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const dateFormat = require('dateformat');
const bcrypt = require('bcryptjs');

// Method override middleware
router.use(methodOverride('_method'));

require('../models/Users');
const Users = mongoose.model('users');
require('../models/Contact');
const Contact = mongoose.model('contact');


router.get('/:userName',(req,res) => {
  const navClass = ["current","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.find({}).then(users =>{
    Users.countDocuments({role:'patient'}).then(countUser =>{
      Users.countDocuments({role:'doctor'}).then(countDocs =>{
        Contact.countDocuments({}).then(contact=>{
          res.render('admin/adminHome',{
          layout:'mainAdmin',
          users: users,
          userName:userName,
          userCount:countUser,
          docCount:countDocs,
          contact:contact,
          navClass:navClass,
          title:'Home'
        });
        })
      });
    });
  });
});
router.get('/:userName/contact',(req, res)=>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","current"];
  Contact.find({}).then((contact)=>{
    res.render('admin/contact',{
          layout:'mainAdmin',
          userName:req.params.userName,
          contact:contact,
          navClass:navClass,
          title:'Contact Information'
        });

  });
});


router.get('/:userName/notification', (req, res) => {
  const navClass = ["sidebar-link","current","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  res.render('admin/notification',{
  	layout:'mainAdmin',
    userName:userName,
    navClass:navClass,
    title:'Notification'
  });
});

router.get('/:userName/patientTable', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","current","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.find({role:'patient'}).then((users) => {
    res.render('admin/patientTable',{
      layout:'mainAdmin',
      userName:userName,
      users:users,
      navClass:navClass,
      title:'Patients'
    });
  })
});

router.get('/:userName/doctorTable', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","current","sidebar-link"];
  const userName=req.params.userName;
  Users.find({role:'doctor'}).then((users) => {
    res.render('admin/doctorTable',{
      layout:'mainAdmin',
      userName:userName,
      users:users,
      navClass:navClass,
      title:'Doctors'
    });
  })
});

router.get('/:userName/adminProfile', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) => {
    const dob=dateFormat(user.dob, "isoDate");
    res.render('admin/adminProfile',{
      layout:'mainAdmin',
      userName:userName,
      user:user,
      dob:dob,
      navClass:navClass,
      title:'Profile'
    });
  })
});


router.get('/:userName/adminMail', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  res.render('admin/adminMail',{
  	layout:'mainAdmin',
    userName:userName,
    navClass:navClass,
    title:'Send Email'
  });
});

router.get('/:userName/patientTable/:id', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  const id=req.params.id;
  Users.findOne({_id:id}).then((user) =>{
    const dob=dateFormat(user.dob, "isoDate");
    res.render('admin/viewPatient',{
      layout:'mainAdmin',
      userName:userName,
      patient:user,
      ptDob:dob,
      navClass:navClass,
      title:'Pateint Profile'
    });
  });
});

router.get('/:userName/patientTable/delete/:id', (req,res) =>{
  const userName=req.params.userName;
  Users.deleteOne({_id:req.params.id}).then(() => {
    res.redirect('/admin/'+userName+'/patientTable')});
});

router.get('/:userName/doctorTable/:id', (req, res) => {
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  const id=req.params.id;
  Users.findOne({_id:id}).then((user) =>{
    const dob=dateFormat(user.dob, "isoDate");
    res.render('admin/viewDoctor',{
      layout:'mainAdmin',
      userName:userName,
      doctor:user,
      docDob:dob,
      navClass:navClass,
      title:'Doctor Profile'
    });
  });
});
router.get('/:userName/doctorTable/delete/:id', (req,res) =>{
  const id=req.params.id;
  const userName=req.params.userName;
  Users.deleteOne({_id:id}).then(() => {
    res.redirect('/admin/'+userName+'/doctorTable')});
});



router.get('/:userName/editAdminProfile', (req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user=>{
    const dob=dateFormat(user.dob, "isoDate");
    res.render('admin/editAdminProfile',{
      layout:'mainAdmin',
      userName:userName,
      user:user,
      dob:dob,
      navClass:navClass,
      title:'Edit Profile'
    });
  }));
});

router.put('/:userName/editAdminProfile',(req, res) =>{
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user) =>{
    user.name = req.body.name;
    user.email = req.body.email;
    user.contact = req.body.contact;
    user.dob = req.body.dob;
    user.save().then((user) =>{
      res.redirect('/admin/'+user.userName+'/adminProfile');
    })
  })
});



router.get('/:userName/changePassword', (req, res) =>{
  const navClass = ["sidebar-link","sidebar-link","sidebar-link","sidebar-link","sidebar-link"];
  const userName=req.params.userName;
  Users.findOne({userName:userName}).then((user=>{
    res.render('admin/changePassword',{
      layout:'mainAdmin',
      userName:userName,
      user:user,
      navClass:navClass,
      title:'Change Password'
    })
  }));
});
router.get('/:userName/grantAccess/:id',(req,res) => {  
  Users.findOne({_id:req.params.id}).then((user) => {
      user.status ='Registered'
      user.save().then((result)=>{
            res.redirect('/admin/'+req.params.userName+'/doctorTable');
      });
  });
});

router.get('/:userName/autocomplete/doc', (req,res,next) => {
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

router.get('/:userName/autocomplete/patient', (req,res,next) => {
  var regex= new RegExp(req.query["term"],'i');
  Users.find({$and:[{name:regex},{role:'patient'}]}).then((users) => {
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
                res.redirect('/admin/'+user.userName);
              });
            });
          });
        }
      }
    });
  }));
});

module.exports = router;