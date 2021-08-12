const fs = require("fs")
let {createClient, spaceCenter} = require("krpc-node")
const speed_path = `${__dirname}/speed.txt`
const alt_path = `${__dirname}/alt.txt`
const missionTime_path = `${__dirname}/missiontime.txt`
const missionName_path = `${__dirname}/mission.txt`
const vehicle = {
	object: null,
	control: null,
	refFrames: {
		surface: null,
		orbit: null
	},
	refFlights: {
		surface: null
	}
}

let altitude = 0
let speed = 0
let missionTime = 0	

let telemInterval = null

const KRPCOptions = {
    rpc: {
        host: "localhost",
        port: "40000",
    },
    stream: {
        host: "localhost",
        port: "40001",
    },
    name: "IKSA-TELEMENTRY"
} 

async function init(){
	const client = await createClient(KRPCOptions)
	vehicle.object = await client.send(spaceCenter.getActiveVessel())
	vehicle.control = await vehicle.object.control.get()
	vehicle.refFrames.surface = await vehicle.object.surfaceReferenceFrame.get();
	vehicle.refFrames.orbit = await vehicle.object.orbit.get();
	vehicle.refFlights.surface = await vehicle.object.flight(vehicle.refFrames.surface)
	
	telem()
	
	console.log("Initialised")
}

init()

async function alt_get(){
	altitude = await vehicle.refFlights.surface.meanAltitude.get()
	altitude = await altitude / 1000
	altitude = await Math.round(altitude * 10) / 10
	
	if(altitude == 0.1) altitude = 0
	const alt_string = altitude.toString()
	fs.writeFile(alt_path, ("  " + alt_string), err =>{
		if(err){
			console.error(err)
		} else {
			alt_get()
		}
	})
}
async function speed_get(){
	if(altitude < 30){
		speed = await vehicle.refFlights.surface.trueAirSpeed.get()
		speed = await Math.round(speed * 3.6)
	} else {
		speed = await vehicle.refFrames.orbit.speed.get()
		speed = await Math.round(speed * 3.6)
	}
	const speed_string = speed.toString()
	fs.writeFile(speed_path, ("  " + speed_string), err =>{
		if(err){
			console.error(err)
		} else {		
			speed_get()
		}
	})
}
async function missionTime_get(){
	MET = await vehicle.object.met.get()
	 if(MET == 0){
		const fetch = require('node-fetch');
		let missionTime = 0
		let url = 'https://iksaauto.va-center.com:4000/status';
		let options = {method: 'GET'};

		fetch(url, options)
		  .then(res => res.json())
		  .then(json => {
			  let T0date = new Date(json.T0Time)
			  let nowDate = new Date()
			  let TCountForm;
			  TCountSec = Math.round(((T0date.getTime() - nowDate.getTime()) /1000))
			  if(Math.sign(TCountSec) == 1){
			  	TCountForm = "  T- " + new Date(TCountSec * 1000).toISOString().substr(11, 8)
			  }else if(Math.sign(TCountSec) == -1){
			  	TCountForm = "  T- 00:00:00"
			  }
			  
			  fs.writeFile(missionTime_path, TCountForm, err =>{
				  if(err){
					console.error(err)
					missionTime_get()
				  } else {		
					missionTime_get()
				  }
			  })
			})
		  .catch(err => console.error('error:' + err));
	} else {
		MissionTime = new Date(MET * 1000).toISOString().substr(11, 8)
		fs.writeFile(missionTime_path, "T+ " + MissionTime, err =>{
				  if(err){
					console.error(err)
				  } else {		
					missionTime_get()
				  }
			  })
	}

}
async function missionName_get(){
	const fetch = require('node-fetch');
	let missionTime = 0
	let url = 'https://iksaauto.va-center.com:4000/status';
	let options = {method: 'GET'};

	fetch(url, options)
	  .then(res => res.json())
	  .then(json => {
		  let mission = json.Name
		  
		  fs.writeFile(missionName_path, mission, err =>{
			  if(err){
				console.error(err)
			  }
		  })
		})
	  .catch(err => console.error('error:' + err));	 
}

async function telem(){
	alt_get()
	speed_get()
	missionTime_get()
 	missionName_get()
}