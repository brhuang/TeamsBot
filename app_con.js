var restify = require('restify');
var builder = require('botbuilder');
var exec = require('child_process').exec;
var fs = require('fs');
//var RedmineOut = null;

function ExecCmd(cmd, session) {
    exec(cmd, function(error, stdout, stderr) {
        //session.send("cmd = " + cmd);
        //session.send("Got it... " + session.userData.issues );
        // command output is in stdout
        console.log("error : " + error);
        console.log("stdout : " + stdout);
        console.log("stderr : " + stderr);
    });
}

//=========================================================
// Bot Setup v1.0
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: 'f037f578-18d3-4b5e-9ef9-4efda35de174',
    appPassword: 'VHh9rA2kALxmf1NiNtxrwvg' 
});
//var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var bot = new builder.UniversalBot(connector, [
    function (session) {
        builder.Prompts.choice(session, "Hello... Any problem?", ["Submit issue", "Just say hello"]);
    },
//    function (session, results) {
//        session.userData.name = results.response;
//        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?"); 
//    },
//    function (session, results) {
//        session.userData.coding = results.response;
//        builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
//    },
//    function (session, results) {
//        session.userData.language = results.response.entity;
//        session.send("Got it... " + session.userData.name + 
//                     "you've been programming for " + session.userData.coding + 
//                     "years and use " + session.userData.language + ".");
//    },
    function (session, results) {
        session.userData.issues = results.response.entity;
        if (session.userData.issues == "Submit issue") {
             builder.Prompts.text(session, "Please give the subject");
        }
        else {
            session.send("Hello...");
            return
        }
    },
    function (session, results) {
        session.userData.subject = results.response;
        var subleng = session.userData.subject.length;
        session.userData.subject = session.userData.subject.substring(18,subleng);
        //session.send("Subject = " + session.userData.subject);
        builder.Prompts.text(session, "Please provide the description");   
    },
    function (session, results) {
        session.userData.description = results.response;
        var desleng = session.userData.description.length;
        session.userData.description = session.userData.description.substring(18,desleng);
        builder.Prompts.choice(session, "Please provide the priority", ["1","2","3","4","5"]);
    },
    function (session, results) {
        session.userData.priority = results.response.entity;
        
        var cpcmd = 'cp /app/issues.xml /app/tmp/issues.xml';
        ExecCmd(cpcmd, session);
        /*session.send("cpcmd = " + cpcmd);
        exec(cpcmd, function(error, stdout, stderr) {
            // command output is in stdout
            console.log("error : " + error);
            console.log("stdout : " + stdout);
            console.log("stderr : " + stderr);
        }); */
        
        var sedcmd = 'sed -i "s/this is the 10th bug for Alfred./' + session.userData.subject + '/g" /app/tmp/issues.xml';
        session.send("sedcmd = " + sedcmd);
        ExecCmd(sedcmd, session);
        /* exec(sedcmd, function(error, stdout, stderr) {
            // command output is in stdout
            console.log("error : " + error);
            console.log("stdout : " + stdout);
            console.log("stderr : " + stderr);
        }); */
        
        sedcmd = 'sed -i "s/Demo/' + session.userData.description + '/g" /app/tmp/issues.xml';
        session.send("sedcmd = " + sedcmd);
        ExecCmd(sedcmd, session);
        
        sedcmd = 'sed -i "s/Pri_Setting/' + session.userData.priority + '/g" /app/tmp/issues.xml';
        session.send("sedcmd = " + sedcmd);
        ExecCmd(sedcmd, session);
 
        var submitcmd = 'curl -v -H "Content-Type: application/xml" -X POST --data-binary "@/app/tmp/issues.xml" -u "eitc:secret"  https://b72c4b06.ngrok.io/issues.xml?key=678fb5bd075ebee0a4636b74857cb6b0ece71cf3';
        //ExecCmd(submitcmd, session);
        exec(submitcmd, function(error, stdout, stderr) {
            //session.send("cmd = " + cmd);
            //session.send("Got it... " + session.userData.issues );
            // command output is in stdout
            console.log("error : " + error);
            console.log("stdout : " + stdout);
            console.log("stderr : " + stderr);
            session.userData.RedmineOut = stdout;
        });
        function sleep (time) {
          return new Promise((resolve) => setTimeout(resolve, time));
        }


        // Usage!

        sleep(1000).then(() => {

        // Do something after the sleep!
        var re = /<id>(.*?)<\/id>/g;  
        session.send("id = " + session.userData.RedmineOut.match(re));
        //session.send("Redmine output : " + session.userData.RedmineOut.substring(0,100));
        console.log("printout : " + session.userData.RedmineOut);
        });    
    }
]);


