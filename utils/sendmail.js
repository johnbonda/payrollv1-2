var express=require('express');
var nodemailer = require("nodemailer");
var app=express();
var config = require("../config.json");

module.exports = {
    sendMail: function (to, subject, text){
        
        var smtpTransport = nodemailer.createTransport(config.email);

        var mailOptions={
            to : to,
            subject : subject,
            text : text
        }
        console.log(mailOptions);
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
                return "error";
            }else{
            console.log("Message sent: " + response.message);
            return true;
            }
        });
    }
}