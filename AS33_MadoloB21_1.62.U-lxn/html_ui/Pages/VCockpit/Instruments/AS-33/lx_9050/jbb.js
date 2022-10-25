class jbb {
    constructor(instrument) {
        this.instrument = instrument; // Reference to main instrument
    
    }

    init() {
        this.init_speedgauge();

        document.getElementById("multiplayer").addEventListener("click", (e)=> {
            let mpelement = document.querySelector(".content.mp");
            if(mpelement.style.display == "block") {
                mpelement.style.display = "none";
            } else {
                mpelement.style.display = "block";
            }
        })

        document.querySelector(".speedgauge").addEventListener("click", (e)=> {
            document.querySelector(".speedgauge").classList.toggle("isHidden");
        });

        document.querySelector("#glidericon #symbol").addEventListener("click", (e)=> {
            console.log("CLICK");
            document.querySelector("#hawk").classList.toggle("isHidden");
        })
    }

    update() {
        if(!document.querySelector(".speedgauge").classList.contains("isHidden")) {
            this.update_speedgauge();
        }
        
        if(!document.querySelector("#hawk").classList.contains("isHidden")) {
            this.jbb_update_hawk();
        }
        
        this.currentBallast = Math.round(SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:2", "kg") + SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:3", "kg") + SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:4", "kg") + SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:5", "kg")  + SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:6", "kg"))
    }


    init_speedgauge() {
            
        var minspeed_kph = 60;
        var stallspeed_kph = 80;
        var maneuverspeed_kph = 200;
        var maxspeed_kph = 270;

        var minspeed_kts = 30;
        var stallspeed_kts = 43;
        var maneuverspeed_kts = 108;
        var maxspeed_kts = 145;

        for(let i = minspeed_kph; i <= maxspeed_kph + 20; i+=5) {
            let t = document.createElement("span");
            let markerclass = "";

            if(i < stallspeed_kph || i >= maxspeed_kph) {  markerclass = "tick_warn";  }
            if(i > maneuverspeed_kph && i < maxspeed_kph) {  markerclass = "tick_alert"; }

            t.setAttribute("class", "tick " + markerclass);

            if((i % 10) == 0) {
                let l = document.createElement("span");
                l.classList.add("label");
                l.innerHTML = i;
                t.append(l);
            }
            document.querySelector(".speedladder.kmh").prepend(t);
        }

        for(let i = minspeed_kts; i <= maxspeed_kts + 20; i+=5) {
            let t = document.createElement("span");
            let markerclass = "";

            if(i < stallspeed_kts || i >= maxspeed_kts) {  markerclass = "tick_warn";  }
            if(i > maneuverspeed_kts && i < maxspeed_kts) {  markerclass = "tick_alert"; }
            t.setAttribute("class", "tick " + markerclass);

            if((i % 10) == 0) {
                let l = document.createElement("span");
                l.classList.add("label");
                l.innerHTML = i;
                t.append(l);
            }
            document.querySelector(".speedladder.kts").prepend(t);
        }

        
        this.setFlapSpeeds();
    }

    update_speedgauge() {
        if(this.slew_mode || document.querySelector(".speedgauge").style.display == "none") { return; }
        let IAS = SimVar.GetSimVarValue("A:AIRSPEED INDICATED", "kph");
        let speedbandoffset = -255;

        document.querySelector(".speedband").setAttribute("class", (this.instrument.speed_units=="kph" ? "speedband kmh" : "speedband kts"));
        document.querySelector(".currentspeed span").innerHTML = this.instrument.speed_units=="kph" ? IAS.toFixed(0) : (IAS / 1.852).toFixed(0);

        if(IAS > 60 && IAS < 350) {
            document.querySelector(".speedladder.kmh").style.transform = "translate(0," + (speedbandoffset + (IAS - 60) * 10) +  "px)";
            document.querySelector(".speedladder.kts").style.transform = "translate(0," + (speedbandoffset + (IAS/1.852 - 30) * 10) +  "px)";

            document.querySelector(".speedladder.kmh .stfmarker").style.transform = "translate(0,-" + (((this.instrument.STF_SPEED_0_MS * this.instrument.MS_TO_KNOTS) * 1.852 - 60) * 10) +  "px)";
            document.querySelector(".speedladder.kts .stfmarker").style.transform = "translate(0,-" + (((this.instrument.STF_SPEED_0_MS * this.instrument.MS_TO_KNOTS) - 30) * 10) +  "px)";

        } else {
            document.querySelector(".speedladder.kmh").style.transform = "translate(0, " + speedbandoffset +  "px)";
            document.querySelector(".speedladder.kts").style.transform = "translate(0, " + speedbandoffset +  "px)";
        }

        // Update Flap-Indication
        let flapindex = SimVar.GetSimVarValue("A:FLAPS HANDLE INDEX", "number");
        // Enter weight factor here to check if Plane weight changed
        if(this.lastBallastfactor != this.currentBallast / 171 * 100) {
            this.setFlapSpeeds();
            this.lastBallastfactor = this.currentBallast / 171 * 100;
        }

        for(var i = 5; i>=0; i--) {
            let flap_el_kmh = document.querySelector(".speedladder.kmh .flap_" + i);
            let flap_el_kts = document.querySelector(".speedladder.kts .flap_" + i);

            flap_el_kmh.style.backgroundColor = "rgba(0,0,0,0.3)";
            flap_el_kts.style.backgroundColor = "rgba(0,0,0,0.3)";

            if(i == flapindex) {
                flap_el_kmh.style.backgroundColor = "#ffcc00";
                flap_el_kts.style.backgroundColor = "#ffcc00";
            }
            
            if(i == flapindex && IAS > parseInt(flap_el_kmh.getAttribute("data-low")) && IAS <= parseInt(flap_el_kmh.getAttribute("data-high"))) {
                flap_el_kmh.style.backgroundColor = "#0d8b3c";
            } 

            if(i == flapindex && IAS/1.852 > parseInt(flap_el_kts.getAttribute("data-low")) && IAS/1.852 <= parseInt(flap_el_kts.getAttribute("data-high"))) {
                flap_el_kts.style.backgroundColor = "#0d8b3c";
            }
        }
    }

    setFlapSpeeds() {
        let weightfactor = this.currentBallast / 171 * 100; // this.vars.ballast_pct.value;
        let flapspeeds_kmh = [[300,300],[167,197],[143,174],[117,147],[99,127],[60,108] ]
        let flapspeeds_kts = [[160,160],[90,107],[77,94],[62,79],[52,68],[30,58] ]
        let lastspeed_kmh = 60;
        let lastspeed_kts = 30;

        for(var i = 5; i>=0; i--) {
    
            let speed_kmh = ((flapspeeds_kmh[i][1] - flapspeeds_kmh[i][0]) / 100 * weightfactor) + flapspeeds_kmh[i][0];
            let speed_kts = ((flapspeeds_kts[i][1] - flapspeeds_kts[i][0]) / 100 * weightfactor) + flapspeeds_kts[i][0];
            
            let flap_el_kmh = document.querySelector(".speedladder.kmh .flap_" + i);
            let flap_el_kts = document.querySelector(".speedladder.kts .flap_" + i);
            flap_el_kmh.style.lineHeight = (((speed_kmh - lastspeed_kmh) * 10) - 2) + "px";
            flap_el_kts.style.lineHeight = (((speed_kts - lastspeed_kts) * 10) - 2) + "px";

            flap_el_kmh.setAttribute("data-low",lastspeed_kmh);
            flap_el_kmh.setAttribute("data-high",speed_kmh);
            flap_el_kts.setAttribute("data-low",lastspeed_kts);
            flap_el_kts.setAttribute("data-high",speed_kts);

            lastspeed_kmh = speed_kmh;
            lastspeed_kts = speed_kts;
        }

    }

    jbb_update_hawk() {
        let current_wind_direction = this.instrument.WIND_DIRECTION_DEG;

        this.jbb_avg_wind_direction = this.jbb_avg_wind_direction != null ? ((0.99 * this.jbb_avg_wind_direction) + (0.01 * current_wind_direction)) : current_wind_direction;

        let averageindicator = this.jbb_avg_wind_direction;

        if(NAVMAP.map_rotation == "trackup") {
            current_wind_direction = current_wind_direction - this.instrument.PLANE_HEADING_DEG;
            averageindicator = averageindicator - this.instrument.PLANE_HEADING_DEG;
        }
        
        let current_wind_speed = this.instrument.WIND_SPEED_MS * this.instrument.MS_TO_KNOTS;
        this.hawkwindspeed = this.hawkwindspeed != null ? (0.9 * this.hawkwindspeed) + (0.1 * current_wind_speed) : current_wind_speed; 
        this.jbb_avg_wind_speed = this.jbb_avg_wind_speed != null ? ((0.99 * this.jbb_avg_wind_speed) + (0.01 * this.hawkwindspeed)) : this.hawkwindspeed;

        document.querySelector("#hawk #arrow_avg").style.transform = "rotate(" + averageindicator + "deg)";
        document.querySelector("#hawk #arrow_current").style.transform = "rotate(" + current_wind_direction + "deg)";

        let wv = Math.min(500, this.hawkwindspeed * 10 + 85);
        document.querySelector("#hawk #arrow_current").style.height = wv +"px";
        document.querySelector("#hawk #arrow_current").style.top = -wv/2 +"px";

        let wvavg = Math.min(500, this.jbb_avg_wind_speed * 10 + 85);
        document.querySelector("#hawk #arrow_avg").style.height = wvavg +"px";
        document.querySelector("#hawk #arrow_avg").style.top = -wvavg/2 +"px";
        

        // Vertical wind indication

        let verticalwind = SimVar.GetSimVarValue("A:AMBIENT WIND Y", "knots");
        this.avg_vert_wind = this.avg_vert_wind != null ? ((0.9 * this.avg_vert_wind) + (0.1 * verticalwind)) : verticalwind;

        if(verticalwind < 0) {
            document.querySelector("#hawkbar").classList.add("negative");
        } else {
            document.querySelector("#hawkbar").classList.remove("negative");
        }

        document.querySelector("#hawkbar").style.height =  Math.abs(this.avg_vert_wind * 18) + "px";
        document.querySelector("#hawkbar .value").innerText = Math.abs((this.instrument.climb_units == "ms"? this.avg_vert_wind * 0.51444 : this.avg_vert_wind)).toFixed(1);
    }

}