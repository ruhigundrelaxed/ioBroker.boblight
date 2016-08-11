"use strict";
var fs = require('fs');
var net = require('net');
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('boblight');
var jf = require('jsonfile');

var scenes = {};

var HOST = '127.0.0.1';
var PORT = 19333;


// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// todo
adapter.on('discover', function (callback) {

});

// todo
adapter.on('install', function (callback) {

});

// todo
adapter.on('uninstall', function (callback) {

});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

adapter.on('stateChange', function (id, state) {
	
	console.log('stateChange ' + id + ' ' + JSON.stringify(state));
	if (!state.ack) {
		var mycommon = {};
		var scene_name = (id.split(".")[id.split(".").length - 1]);
		mycommon["name"] = "activescene";
		mycommon["role"] = 'text';
		var mystate = {type: 'state', common: mycommon, native: {id:"activescene"}}; 
		adapter.setObject(("activescene"), mystate);
		adapter.setState("activescene",scene_name, true);
		
				
		
	}
});




adapter.on('ready', function () {
    main();
});


function main() {
    var client = new net.Socket();
    var light_arr = [];
    var mystr = '';
    

    client.connect(adapter.config['bobl_port'], adapter.config['address'], function() {
        adapter.log.info('Connected to Boblightserver: ' + adapter.config['address'] + ':' + adapter.config['bobl_port'] + ' Saying hello...');

        client.write('hello\n');

    });
    client.on('data', function(data) {
        if (data.toString() == 'hello\n'){
            adapter.log.info('Server said hello to us! Asking for Version....')
            client.write('get version\n');
        }
        if (data.toString() == 'version 5\n'){
            adapter.log.info('Server answered: ' + data.toString());
            adapter.log.info('Asking Server for Light config... ');
            client.write('get lights\n');

            client.write('set priority 1\n');
        }
        if (data.toString().substr(0,5) == 'light'){
            light_arr = data.toString().split('\n');
            adapter.log.info('Server told us the configuration of ' + light_arr.length + ' Lights');
            get_scenes(light_arr);
        }
    });

function get_scenes(light_arr){
	
	var file_arr = fs.readdirSync(__dirname + '/scenes/')
	for (var i = 0; i <= (file_arr.length -1); i++){
		var mycommon = {};
		var file_name = file_arr[i];
		var file_sub_arr = file_name.split(".");
		if ((file_sub_arr[0] == adapter.name)&&(file_sub_arr[1] == adapter.instance) &&(file_sub_arr[3] == 'json' ) ){
			 var scene_name = file_sub_arr[2];
				console.log(scene_name);
			
				scenes[scene_name] = jf.readFileSync(__dirname + '/scenes/' + file_arr[i]);
				mycommon["name"] = scene_name;
				mycommon["role"] = 'button';
				var mystate = {type: 'state', common: mycommon, native: {id:"scenes." + scene_name}}; 
				adapter.setObject(("scenes." + scene_name), mystate);
		}
	}	
};
    
    
    
    
adapter.subscribeStates('*');

var framecounter = 0;
setInterval(function(){
	adapter.getState('activescene' ,function (err,state){
		if(scenes[state.val]){
			 if (framecounter < scenes[state.val].length){	
				  client.write (scenes[state.val][framecounter]);
				  client.write ('sync\n');
				  framecounter++;
			    
			}else{
				framecounter = 0;
			}
		}
	
	});
}, 50);

    
    
}






	    		

































