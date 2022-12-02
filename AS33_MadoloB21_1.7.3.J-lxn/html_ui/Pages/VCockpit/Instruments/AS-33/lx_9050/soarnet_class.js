class soarnet {
    constructor(instrument) {
        this.instrument = instrument; // Reference to main instrument
        this.isActive = false;
        this.currentEvent = "test";
    }

    init() {
        try {
            this.debuglog = document.getElementById("debug");
        } catch(e) {
            console.error(e);
        }

        document.getElementById("username").value = SimVar.GetSimVarValue("ATC ID", "string"); 

        document.getElementById("mpformsubmit").addEventListener("click", function(e) {
            e.preventDefault();
            if(document.getElementById("username").value == "") {
                document.querySelector(".mainmessage").innerHTML = "Please enter a username";
                return false; 
            }

            SN.mpUsername = document.getElementById("username").value;
            SOARNET.initConnection();
            document.querySelector(".mainmessage").innerText = "connecting...";

            let count = 0;
        let connector = window.setInterval(function() {
            if(SOARNET.checkvalue.masterkey == "isActive" && SOARNET.checkvalue.ssckey == "isActive") { 
                document.querySelector(".mainmessage").innerText = "";
                document.querySelector(".mp").classList.remove("notConnected");
                window.clearInterval(connector);
                SN.log("connected to soarnet in " + count + " Milliseconds<br>");
            } else {
                if(count >= 3000) {
                    document.querySelector(".mainmessage").innerText = "Sorry, System currently not available.";
                    window.clearInterval(connector);
                }    
                count ++;
            }
        }, 1)
            
        })

        document.getElementById("addEventLink").addEventListener("click", function(e) {
            e.preventDefault();
            document.getElementById("addEvent").classList.toggle("on");
        })

        document.getElementById("addEvent").addEventListener("submit", function(e) {
            e.preventDefault();
            if(document.getElementById("utchours").value > 23 || document.getElementById("utcmin").value > 59 || document.getElementById("eventtitle").value == "") {
                return false;
            }

            SN.currentEvent = SOARNET.createEvent({
                "title": document.getElementById("eventtitle").value,
                "time": SOARNET.creatUTCstarttime_s(document.getElementById("utchours").value, document.getElementById("utcmin").value),
                "wpstart": B21_SOARING_ENGINE.task.start_wp().position,
                "wpfinish": B21_SOARING_ENGINE.task.finish_wp().position
            })
            
            document.getElementById("addEvent").classList.remove("on");
        })

        document.getElementById("eventlist").addEventListener("click", function(e) {
            e.preventDefault();
            let el = e.target;
            SN.currentEvent = el.getAttribute("data-id");
            SOARNET.joinEvent();
        })

        document.getElementById("leave_event").addEventListener("click",function(e) {
            e.preventDefault();
            try {
                SOARNET.writeUserData(SN.currentEvent, SOARNET.userId, null);
                SOARNET.detachlistener();
                NAVMAP.wipeMultiplayers();
                document.getElementById("mpcountdown").innerText = "";
            } catch(e) {
                console.log(e);
            }
            
            SN.currentEvent = "";
            SN.isActive = false;
            document.querySelector(".mp").classList.add("noEvent");
            document.querySelector("#userlist tbody").innerHTML = "";
        })

        document.getElementById("disconnect").addEventListener("click", function(e) {
            e.preventDefault();
            document.querySelector(".mp").classList.add("notConnected");
        })

        SOARNET.updateEventInfo();
    }

    disconnectedCallback() {
        SOARNET.deleteEventUser(this.currentEvent, this.userId);
    }

    update() {
        if(SOARNET.checkvalue.debug == "true") { SN.debuglog.style.display = "block"; } else { SN.debuglog.style.display = "none"; }
        if(!B21_SOARING_ENGINE.task_active()) { return; }

        if(this.isActive) {
             
            if(!SOARNET.isSolo) {
                this.updateUserdata();
                document.querySelector("#mp_info").innerHTML = (SOARNET.eventDetails && SOARNET.eventDetails[this.currentEvent]) ? SOARNET.eventDetails[this.currentEvent].title : "";
            } else {
                document.querySelector("#mp_info").innerHTML = "Waiting for pilots to connect";
                NAVMAP.wipeMultiplayers();
            }

            SOARNET.displayUserList();
            
            let time_to_start = (SOARNET.eventDetails && SOARNET.eventDetails[this.currentEvent]) ? SOARNET.getTimetostart_s(SOARNET.eventDetails[this.currentEvent].time) : 1;   
            if (time_to_start <= 0 && !B21_SOARING_ENGINE.task_started()) {

                document.getElementById("mpcountdown").innerText = SOARNET.formatTime(time_to_start);
                if(time_to_start >= -10) {
                    if(time_to_start <= -1) { 
                        SOARNET.countdown(Math.abs(time_to_start),300) 
                    } else {
                        SOARNET.countdown("GO",300);
                        window.setTimeout(SOARNET.countdown_off,3000);
                    }
                    
                } 
                
            } else {
                document.getElementById("mpcountdown").innerText = "";
            }
        }
    }

    updateUserdata() {
        document.querySelector("#mp_info").innerHTML = "";
        let taskstate = "not started";
        let avg_speed = 0;
        let tasktime = 0;
        if(B21_SOARING_ENGINE.task_started()) { taskstate = "started"; avg_speed = B21_SOARING_ENGINE.task.avg_task_speed_kts(); tasktime = B21_SOARING_ENGINE.task_time_s() }
        if(B21_SOARING_ENGINE.task_finished()) { taskstate = "finished"; avg_speed = B21_SOARING_ENGINE.finish_speed_ms() / 0.51444; tasktime = B21_SOARING_ENGINE.task.finish_time_s - B21_SOARING_ENGINE.task.start_time_s; }

        SOARNET.writeUserData(
            this.currentEvent, SOARNET.userId, {
                "username": this.mpUsername,
                "lat":      parseFloat(SimVar.GetSimVarValue("A:PLANE LATITUDE", "degrees latitude")),
                "long":     parseFloat(SimVar.GetSimVarValue("A:PLANE LONGITUDE", "degrees longitude")),
                "hdg":      Math.round(SimVar.GetSimVarValue("A:PLANE HEADING DEGREES TRUE","degrees")),
                "alt":      SimVar.GetSimVarValue("A:PLANE ALTITUDE", "feet"),
                "dist":     B21_SOARING_ENGINE.task.distance_m() - B21_SOARING_ENGINE.task.remaining_distance_m(),
                "avg":      avg_speed,
                "tasktime": tasktime,
                "taskstate":taskstate,
                "time":     Math.floor(Date.now() / 1000)
            }
        )
    }

    log(msg) {
        if(this.debuglog) {
            this.debuglog.innerHTML += msg;
            this.debuglog.scrollTop = this.debuglog.scrollHeight;
        }
    }
}

SOARNET.displayUserList = function(){
    let i = 1;
    let userList = [];
    let finisherlist = [];

    try {
        let list = document.querySelector("#userlist tbody");    
        let now = Math.floor(Date.now() / 1000);
        list.innerHTML = "";
        
        for (user in SOARNET.eventusers) {
            
            if(SOARNET.eventusers[user].taskstate == "finished") {
                finisherlist.push(SOARNET.eventusers[user]);
            } else {
                if (SOARNET.eventusers[user].taskstate == "not started") { SOARNET.eventusers[user].dist = -1; }
                userList.push(SOARNET.eventusers[user]);
            }
                
            if(typeof(TOPOMAP.addLayer) == "function" && user != this.userId) {
                try {
                    NAVMAP.paintMultiplayers(user, SOARNET.eventusers[user]);
                } catch(e) {
                    console.log(e);
                    NAVMAP.wipeMultiplayers();
                } 
            }
                
        }

        finisherlist.sort((a,b) => {
            return parseInt(a.tasktime) - parseInt(b.tasktime);
        })

        userList.sort((a,b) => {
            return parseInt(b.dist) - parseInt(a.dist);
        })

        

        finisherlist.forEach((el) => {
            list.innerHTML += "<tr><td class='alignright'>" + i + "</td><td class='mpusername'>" + el.username + "</td><td>" + parseFloat(el.alt).toFixed(0) + "</td><td class='alignright'>" + parseFloat(el.avg).toFixed(0) + "</td><td class='alignright'>" + SOARNET.formatTime(el.tasktime) + "</td></tr>";
            i++;
        })

        userList.forEach((el) => {
        list.innerHTML += "<tr><td class='alignright'>" + (el.taskstate == "not started" ? "--" : i) + "</td><td class='mpusername'>" + el.username + "</td><td>" + parseFloat(el.alt).toFixed(0) + "</td><td class='alignright'>" + (el.taskstate == "not started" ? "-" : parseFloat(el.avg).toFixed(0)) + "</td><td class='alignright'>" + (el.taskstate == "not started" ? "0" : (parseFloat(el.dist) / 1000).toFixed(1)) + "</td></tr>";
        i++;  
        })
    } catch(e) {
        console.error(e);
        SN.log("ERROR: " + e);
    }


    SOARNET.numusers = i - 1;
    if(SOARNET.numusers != SOARNET.lastnumusers) {
        SN.log(SOARNET.numusers + " User(s) in current Event. (" + finisherlist.length + " finished)<br>");
        SOARNET.lastnumusers = SOARNET.numusers;
    }

    SOARNET.isSolo = i == 2 ? true : false;
  }

SOARNET.updateEventInfo = function() {
    if( document.getElementById("eventlist") == null) { return; }
    let list = document.getElementById("eventlist");
    list.innerHTML = "";

    for(var event in SOARNET.eventDetails) {
        if(SOARNET.eventDetails[event].wpstart.lat == B21_SOARING_ENGINE.task.start_wp().position.lat && SOARNET.eventDetails[event].wpfinish.long == B21_SOARING_ENGINE.task.finish_wp().position.long) {
            let starttime =  new Date(SOARNET.eventDetails[event].time * 1000).toUTCString().replace(/.*(\d\d:\d\d:\d\d).*/,"$1");
            list.innerHTML += '<li><h3>' + SOARNET.eventDetails[event].title + '</h3><p>Task starts: ' +starttime + ' UTC</p><a href="#" class="eventClickhandler" data-id="' + event + '"></a></li>';
        }
    }
}

SOARNET.joinEvent = function() {
    SOARNET.createListener(SN.currentEvent);
    SOARNET.userId = SOARNET.userId == "" ? SOARNET.getUserId(SN.currentEvent) : SOARNET.userId ;           
    SN.isActive = true;
    SN.log("Joined event " + SOARNET.eventDetails[SN.currentEvent].title + " with user id " + SOARNET.userId + "<br>");
    document.querySelector(".mp").classList.remove("noEvent");
}

SOARNET.creatUTCstarttime_s = function(eventHours,eventMinutes) {
    let now = new Date();
    return Date.UTC(now.getFullYear(),now.getMonth(),now.getDate(),parseInt(eventHours),parseInt(eventMinutes)) / 1000;
}

SOARNET.getTimetostart_s = function(eventStart_s) {
    let now = new Date();
    return Date.UTC(now.getFullYear(),now.getMonth(),now.getDate(),(now.getHours() + (now.getTimezoneOffset() / 60)),now.getMinutes(),now.getSeconds()) / 1000 - eventStart_s;
}

SOARNET.countdown = function(number,size) {
    let cd = document.getElementById("countdown");
    cd.style.fontSize = size + "px";
    cd.innerText = number;
    cd.style.display = "block";
} 

SOARNET.countdown_off = function() {
    console.log("countdown off!!");
    document.getElementById("countdown").style.display = "none";
}

SOARNET.formatTime = function(val) {
    let prefix = val < 0 ? "-" : "";
    let time = Math.abs(val);
    let seconds = Math.floor(time % 60);
    let minutes = Math.floor((time / 60) % 60);
    let hours = Math.floor(Math.min(time / 3600, 99));
    result = prefix + hours + ":" + ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2);

    return result;
}