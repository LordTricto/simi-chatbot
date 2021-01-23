// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
const axios = require('axios');
const mysql = require('mysql');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    let conv = agent.conv();
    conv.ask(`where are you going to?`);
    agent.add(`Hello, I am Simi`);
    agent.add(`Where are you going to? (e.g., From Post office, Challenge to Sango Bus Stop)`);
  }
 
  function fallback(agent) {
    agent.add(`Sorry, I didn't get that. Try stating the FROM and TO locations e.g. "From Sango, oyun to Post Office"`);
  }
  
 // Establishing connection to database   
 function connectToDatabase(){
    const connection = mysql.createConnection({
      host     : 'remotemysql.com',
      user     : 'whslJRgtK3',
      password : 'gij5T1X18Z',
      database : 'whslJRgtK3'
    });
    return new Promise((resolve,reject) => {
       connection.connect();
       resolve(connection);
    });
  }	
  
 //Database query for journey within ilorin
 function queryDatabase(connection){
   
    const destination = agent.parameters.destination;
    const origin = agent.parameters.origin;
    var journey = origin.concat("_",destination);
    const newjourney = journey.toLowerCase();
   
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM commuters_guide WHERE journeys='${newjourney}';`, (error, result, fields) => {
        resolve(result);
      });
    });
  }
  
 //Database query for interstate journey  
 function queryInterstateDatabase(connection){
   
    const destination = agent.parameters.destination;
    const origin = "kwara";
    var journey = origin.concat("_",destination);
    const newjourney = journey.toLowerCase();
   
    return new Promise((resolve, reject) => {
      connection.query(`SELECT * FROM interstate WHERE journeys='${newjourney}';`, (error, result, fields) => {
        resolve(result);
      });
    });
  }
 //Function to display directions for journey within ilorin
 function Directions() {
  
    	const destination = agent.parameters.destination;
     	const origin = agent.parameters.origin;
    
    	return connectToDatabase()
    	.then(connection => {
     	return queryDatabase(connection)
      		.then(result => {
            	console.log(result);
             	result.map(travel => {            
                const bot_response = `To get to ${destination} from ${origin}:\r\n${travel.directions}\r\n${travel.cost}`;
	               agent.add(bot_response);
     		  });             
        connection.end();
      });
   });  
}
  
 //Function to display directions for interstate journey
 function interstate_info() {
  
     const destination = agent.parameters.destination;
 
    	return connectToDatabase()
    	.then(connection => {
     	return queryInterstateDatabase(connection)
      		.then(result => {
            	console.log(result);
             	result.map(travel => { 
                   const bot_response = `To get to ${destination} from Kwara State, the available park(s):\r\n\r\n${travel.park_info}`;
	               agent.add(bot_response);
     		  }); 
        connection.end();
      });
          
    });
}
  
  
  
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Directions Intent', Directions);
  intentMap.set('interstate intent', interstate_info);
  agent.handleRequest(intentMap);
});