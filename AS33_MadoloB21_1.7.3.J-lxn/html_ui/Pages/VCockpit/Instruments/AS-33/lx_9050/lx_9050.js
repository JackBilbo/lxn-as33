/*
    B21 LX 9050 Nav Panel

    Uses:
     "Geo" class            from /Pages/VCockpit/Instruments/AS-33/b21_includes/geo.js
     "MapInstrument" class  from \Pages\VCockpit\Instruments\Shared\Map\MapInstrument.js
            -- which (as .navMap) uses SvgMap class from \Pages\VCockpit\Instruments\Shared\Map\Svg

    Local vars:
        "Z:B21_STF_SPEED_0_MS","meters per second"  - READ - From b21_soaring_engine - Current speed-to-fly at zero sink meters per second
        "Z:B21_STF_SINK_0_MS","meters per second"   - READ - From b21_soaring_engine - Polar sink rate meters per second at the zero sink speed-to-fly
        "Z:B21_GLIDE_RATIO","number"                - READ - From model XML - Current L/D glide ratio

        "Z:B21_SETTING_CHANGE","number"             - READ/WRITE - From other gauges - toggles 0/1 when settings change

        "Z:B21_LX_9050_BUTTON_1_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_BUTTON_2_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_BUTTON_3_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_BUTTON_4_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_BUTTON_5_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_BUTTON_6_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_BUTTON_7_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_BUTTON_8_TOGGLE","bool"          - READ - From model xml -Toggles true/false when button clicked
        "Z:B21_LX_9050_DIAL_1_UP_TOGGLE","bool"         - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_1_DOWN_TOGGLE","bool"       - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_2_UP_TOGGLE","bool"         - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_2_DOWN_TOGGLE","bool"       - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_3_UP_TOGGLE","bool"         - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_3_DOWN_TOGGLE","bool"       - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_3_CLICK","bool"             - READ - From model xml - Toggles true/false when knob clicked
        "Z:B21_LX_9050_DIAL_4_UP_TOGGLE","bool"         - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_4_DOWN_TOGGLE","bool"       - READ - From model xml -Toggles true/false when knob rotated
        "Z:B21_LX_9050_DIAL_4_CLICK","bool"             - READ - From model xml - Toggles true/false when knob clicked

        "Z:B21_WP_BEARING_DEG","degrees"            - WRITE - bearing to current waypoint degrees true
        "Z:B21_WP_VMG_MS","meters per second"       - WRITE - velocity made good towards current waypoint

this.map_instrument is a MSFS MapInstrument JS Object supporting <map_instrument> HTML element
    asobo-vcockpits-instruments\html_ui\Pages\VCockpit\Instruments\Shared\Map\MapInstrument.js
    Note these 'map' classes are HARDCODED to 1000x1000 pixels.

        .init(LX_9050_class object)
        .update(_deltaTime)
        .navMap : SvgMap object (see below)
        .getIsolines()
        .showIsolines()
        .resize()
        .centerOnPlane()
        .updateBingMapSize()
        .scrollMap(Xpx,Ypx)
        .zoomOut()
        .zoomIn()
        .getZoom() - returns index of current range setting

this.map_instrument.navMap is a MSFS SvgMap object using the FIRST <svg> element
    asobo-vcockpits-instruments\html_ui\Pages\VCockpit\Instruments\Shared\Map\Svg
                                                    -- LL is e.g. new LatLong(52.2,0.123) = {"lat": 52.2, "long": 0.123 }
                                                    -- XY is e.g. {"x": 123.4, "y": 456.7 }
        .coordinatesToXY(LL)                        -- map lat/long to svg X/Y coordinates
        .centerCoordinates                          -- return LL of center of map i.e. at {"x": 500, "y": 500 }
        .setCenterCoordinates(LL)                   -- set LL of center of map
        .setCenterCoordinates(lat,long, smoothing)  -- set lat,long of center of map e.g. smoothing = 5
        .planeCoordinates                           -- get LL of plane
        .setPlaneCoordinates(LL)
        .setPlaneCoordinates(lat,long,smoothing)
        .NMWidth                                    -- get,set E/W width of map in NM
        .NMHeight                                   -- get, set N/S height of map in NM
        .NMToPixels(distanceInNM)
        .deltaLatitudeToPixels(deltaLatitude)
        .deltaLongitudeToPixels(deltaLongitude)
        .isVec2InFrame(p, safetyMarginFactor = 0)   -- is Vec2(X,Y) in frame (px)
        .isLatLongInFrame(ll, safetyMarginFactor = 0)
        .XYToCoordinates(xy)                        -- returns LatLongAlt() object

*/

let JBB, NAVMAP, TOPOMAP, SN, SOARNET;

// *****************************************************
// ********* LX_9050 instrument class  *****************
// *****************************************************

class LX_9050_class extends BaseInstrument {
    constructor() {
        super();
        this._isConnected = false;

        this.DISABLE_DEBUG_LOG = false;

        // Constants
        this.MS_TO_KNOTS = 1.94384; // speed conversion consts
        this.MS_TO_KPH = 3.6;    // meter per second to kilometer per hour
        this.M_TO_FEET = 3.28084;   // meter to foot
        this.M_TO_NM = 1 / 1852; // Meters to Nautical Miles.
        this.M_TO_MILES = 1 / 1609.34; // Meters to Statute Miles
        this.MS_TO_FPM = 196.85; // meter per second to foot per minute
        this.RAD_TO_DEG = 57.295; // Radians to degrees

        // task will be drawn in dashed lines of these colors
        this.TASK_LINE_WIDTH = 6;
        this.TASK_LINE_DASH_SIZE = 30;
        this.TASK_LINE_CURRENT_COLOR = "#FF9D1E";     // colors just for the current leg
        this.TASK_LINE_CURRENT_COLOR_ALT = "#44273F"; // darker orange?
        this.TASK_LINE_COLOR = "#C60AC6";       // for all task legs except current
        this.TASK_LINE_COLOR_ALT = "#55112F";

        this.WAYPOINT_CIRCLE_COLOR = "#FF9D1E";
        this.WAYPOINT_CIRCLE_COLOR_ALT = "#44273F";
        this.WAYPOINT_CIRCLE_WIDTH = 4;

        this.RANGE_COLOR = "#FF9D1E";
        this.RANGE_COLOR_ALT = "#44273F";
        this.RANGE_DASH_SIZE = 30;
        this.RANGE_WIDTH = 4;

        this.WP_SELECTED_COLOR = "#FFFF66";
        this.WP_NON_TASK_COLOR = "#999999";

        this.MAP_SIZE = 1740; // Map div (square) scaled dimensions in px (actual map is 1000x1000)

        this.map_rotation = EMapRotationMode.NorthUp;
        console.log("map_rotation is "+this.map_rotation);

        this.thermalling_display = new ThermallingDisplay(this);
    }

    get templateID() { return "LX_9050"; }

    get isInteractive() { return true;}

    connectedCallback() {
        super.connectedCallback();
        this._isConnected = true;

        NAVMAP = new navmap(this);
        JBB = new jbb(this); JBB.init();

        this.map_instrument_loaded = false;

        this.ex=1;
        try {

            this.ex=2;

            // Knob overlays
            this.knob_1_el = document.getElementById("lx_9050_knob_overlay_1");
            this.knob_2_el = document.getElementById("lx_9050_knob_overlay_2");
            this.knob_3_el = document.getElementById("lx_9050_knob_overlay_3");
            this.knob_4_el = document.getElementById("lx_9050_knob_overlay_4");

            // Map display elements
            this.map_overlay_el = document.getElementById("lx_9050_map_overlay");
            this.task_svg_el = document.getElementById("lx_9050_task");

            // Main div that shows/hides content depending on Main Battery
            this.battery_required_el = document.getElementById("battery_required");

            this.ex=3;

            // We want these PX values initialised before Map start (so center is correct)
            this.nav_y_offset_px = 1024;
            this.dropdown_px = 0; // We will adjust center of map if AI is enabled/disabled

            // B21_SOARING_ENGINE var declared in b21_soaring_engine.html in same VCOCKPIT as this LX9050
            B21_SOARING_ENGINE.register_callback(this, this.engine_event_callback);

            this.ex=9;
        } catch (e) {
            this.debug_log("Ex.C."+this.ex);
            console.log(e);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    // Initialize display from settings values e.g. units
    // Will be called any time settings are changed.
    gauge_init() {
        if (this.init_nav_completed) {
            this.nav_wp_content();
        }
    }

    Update() {
        // Ensure connectedCallback() is called first
        if (!this._isConnected) {
            return;
        }
        this.ex=1;
        try {
            NAVMAP.load_map(); // Will initialize map-instrument on first call

            // Generally we load SimVars here at start of Update() loop, as they are used in multiple functions

            this.TIME_S = SimVar.GetSimVarValue("E:SIMULATION TIME","seconds");
            this.LOCAL_TIME_S = SimVar.GetSimVarValue("E:LOCAL TIME","seconds");
            this.SLEW_MODE = SimVar.GetSimVarValue("IS SLEW ACTIVE", "bool") ? true : false; // Convert number to JS boolean
            this.ENGINE_RUNNING = SimVar.GetSimVarValue("A:GENERAL ENG COMBUSTION:1","boolean") ? true : false;

            this.ELECTRICAL_MASTER_BATTERY = SimVar.GetSimVarValue("A:ELECTRICAL MASTER BATTERY","boolean") ? true : false;

            this.PLANE_POSITION = this.get_position(); // returns a MSFS LatLong()
            this.PLANE_HEADING_DEG = SimVar.GetSimVarValue("A:PLANE HEADING DEGREES TRUE","degrees");
            this.PLANE_TRACK_DEG = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK","radians") * this.RAD_TO_DEG;
            this.AIRSPEED_MS = SimVar.GetSimVarValue("A:AIRSPEED TRUE", "feet per second") / this.M_TO_FEET;
            //this.ALTITUDE_M = SimVar.GetSimVarValue("A:INDICATED ALTITUDE", "feet") / this.M_TO_FEET;
            this.ALTITUDE_M = SimVar.GetSimVarValue("A:PLANE ALTITUDE", "feet") / this.M_TO_FEET;
            let xyz = SimVar.GetGameVarValue("AIRCRAFT ORIENTATION AXIS", "XYZ");
            this.PITCH_DEG = xyz.pitch / Math.PI * 180;
            this.BANK_DEG = xyz.bank / Math.PI * 180;
            this.WIND_DIRECTION_DEG = SimVar.GetSimVarValue("A:AMBIENT WIND DIRECTION", "degrees");
            this.WIND_SPEED_MS = SimVar.GetSimVarValue("A:AMBIENT WIND VELOCITY", "meters per second");
            // Speed to fly for current maccready setting at zero sink
            this.STF_SPEED_0_MS = SimVar.GetSimVarValue("Z:B21_STF_SPEED_0_MS","meters per second"); // From LX_S100
            // Polar sink rate at the zero sink speed-to-fly
            this.STF_SINK_0_MS = SimVar.GetSimVarValue("Z:B21_STF_SINK_0_MS","meters per second"); // From LX_S100 (sink is negative)
            //this.ON_GROUND = SimVar.GetSimVarValue("SIM ON GROUND","bool") ? true : false;

            // BUTTON KNOB KEY EVENT VARS
            this.BUTTON_1_VAR = SimVar.GetSimVarValue("A:ATTITUDE CAGE","boolean") ? true : false;
            this.BUTTON_3_VAR = SimVar.GetSimVarValue("A:PITOT HEAT SWITCH","boolean") ? true : false;
            this.BUTTON_4_VAR = SimVar.GetSimVarValue("A:ALTERNATE STATIC SOURCE OPEN","boolean") ? true : false;
            this.BUTTON_6_VAR = SimVar.GetSimVarValue("A:WINDSHIELD DEICE SWITCH","boolean") ? true : false;

            this.KNOBS_VAR = ("0000" + SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number")).slice(-4); // knobs encoded in 4 digits of XPNDR

            // Additional vars used by thermalling_display
            this.NETTO_MS = SimVar.GetSimVarValue("Z:B21_NETTO_MS","meters per second"); // From b21_soaring_engine_class
            this.TE_MS = SimVar.GetSimVarValue("Z:B21_TE_MS", "number"); // From model xml
            this.MACCREADY_MS = SimVar.GetSimVarValue("Z:B21_MACCREADY_MS", "meters per second");
            this.WP_BEARING_DEG = B21_SOARING_ENGINE.current_wp() == null ? null : B21_SOARING_ENGINE.current_wp().bearing_deg;

            if (NAVMAP.map_instrument_loaded) {
                this.once("map_instrument_loaded",() => console.log("map_instrument_loaded"));
                this.ex="K";this.update_sim_time();
                this.ex="A";this.update_settings();
                this.ex="B";this.update_battery_required();
                this.ex="C";this.update_nav();
                this.ex="D";NAVMAP.update_map();
                //this.ex="E";this.update_task();
                this.ex="F";this.update_task_page();
                this.ex="G";this.update_ai();
                this.ex="M";this.update_task_message(); // Clear any task message after display period
                this.ex="T";this.thermalling_display.update();
                //this.ex="H";this.update_task_wp_switch(); // Checks for task started (e.g. so can remove popup msg)
                if (this.ELECTRICAL_MASTER_BATTERY) {
                    this.ex="J";this.update_interaction();
                }

                this.ex="JBB"; JBB.update();

            }
            //document.getElementById("lx_9050_debug").innerHTML += "B21.update.end."+Math.floor(SimVar.GetSimVarValue("E:ABSOLUTE TIME","seconds") % 10);
        } catch (e) {
            this.debug_log("Ex.Update."+this.ex);
            console.log(e);
            this.DISABLE_DEBUG_LOG = true; // Prevent more log messages
        }

    }

    // Utility function to call a routine ONCE, useful within update loops
    //DEBUG comment out 'once' console.log calls
    once(label,fn) {
        if (this["once_"+label]==null) {
            this["once_"+label] = true;
            fn();
        }
    }

    // ***********************************************************************
    // ********** Sim time - stops on pause when airborn        **************
    // **  Writes   this.SIM_TIME_S       --  absolute time (s) that pauses
    // ***********************************************************************

    init_sim_time() {
        this.SIM_TIME_S = this.TIME_S;
        this.SIM_TIME_PAUSED = false;
        this.SIM_TIME_NEGATIVE = false;
        this.SIM_TIME_SLEWED = false;
        this.SIM_TIME_ENGINE = false;
        this.SIM_TIME_ALERT = false;
        this.SIM_TIME_LOCAL_OFFSET = this.TIME_S - this.LOCAL_TIME_S; // So local time is SIM_TIME - SIM_TIME_LOCAL_OFFSET
        this.sim_time_delay_s = 0;
        this.sim_time_prev_time_s = this.TIME_S;
        this.sim_time_prev_update_s = (new Date())/1000;
    }

    update_sim_time() {
        this.ex="K1";
        if (this.SIM_TIME_S==null) {
            this.init_sim_time();
            return;
        }

        let update_s = (new Date())/1000;

        this.ex="K2";
        // Detect SLEWED, TIME_NEGATIVE
        if (B21_SOARING_ENGINE.task_active() &&
            B21_SOARING_ENGINE.task_started() &&
            ! B21_SOARING_ENGINE.task_finished()) {
            this.ex="K21";
            if (this.SLEW_MODE) {
                this.SIM_TIME_SLEWED = true;
            }
            // Detect time adjust backwards
            this.ex="K22";
            if (this.TIME_S < this.sim_time_prev_time_s) {
                this.SIM_TIME_NEGATIVE = true;
            }
            this.ex="K23";
            if (this.ENGINE_RUNNING) {
                this.SIM_TIME_ENGINE = true;
            }
            this.ex="K24";
            let delay_s = update_s - this.sim_time_prev_update_s;
            if (delay_s > 5) { // Paused for more than 5 seconds
                this.ex="K241";
                this.SIM_TIME_PAUSED = true;
                this.sim_time_delay_s += delay_s;
            }
        }

        this.ex="K4";
        this.sim_time_prev_time_s = this.TIME_S;
        this.SIM_TIME_S = this.TIME_S - this.sim_time_delay_s;
        this.sim_time_prev_update_s = update_s;
        this.ex="K9";
    }

    // ***********************************************************************
    // ********** Battery required        ************************************
    // ***********************************************************************

    // Sets outer div to display = block | none depending on aircraft power.
    update_battery_required() {
        if (this.battery_required_power_available == null ||
            this.battery_required_power_available != this.ELECTRICAL_MASTER_BATTERY) {
            // power status changed
            this.battery_required_power_available = this.ELECTRICAL_MASTER_BATTERY;
            if (this.ELECTRICAL_MASTER_BATTERY) {
                this.power_on();
            }
            this.battery_required_el.style.display = this.ELECTRICAL_MASTER_BATTERY ? "block" : "none";
        }
    }

    // *******************************************************************************************************************
    // ********** Power on                                                            ************************************
    // *******************************************************************************************************************

    power_on() {
        this.load_settings();
        this.nav_initial_setup = null; // Trigger a nav display refresh if a task is loaded

        this.update_button_1_status("off"); // "off", "thermalling", "ai"
    }

    //***********************************************************************************
    //***********  B21_SOARING_ENGINE event handlers             ************************
    //***********************************************************************************

    // These functions are registered as callbacks to B21_SOARING_ENGINE
    // b21_soaring_engine callback args object properties:
        // TASK_WP_CHANGE        { wp }     -- waypoint has changed
        // TASK_START            { wp, start_local_time_s, start_alt_m } -- success
        // TASK_START_TOO_LOW    { wp }     -- fail
        // TASK_START_TOO_HIGH   { wp }     -- fail
        // TASK_WP_COMPLETED     { wp }     -- success
        // TASK_WP_NOT_COMPLETED { wp }     -- fail: out of order
        // TASK_FINISH           { wp, finish_speed_ms, completion_time_s } -- success
        // TASK_FINISH_TOO_LOW   { wp }     -- fail
        // TASK_FINISH_TOO_HIGH  { wp }     -- fail

    engine_event_callback(event_name, args) {
        console.log("lx9050 engine event "+event_name, args);
        switch (event_name) {
            case "TASK_WP_CHANGE":
                this.engine_task_wp_change(args); // { wp }
                NAVMAP.updateTaskline();
                break;

            case "TASK_WP_COMPLETED":
                this.engine_task_wp_completed(args); // { wp }
                break;

            case "TASK_WP_NOT_COMPLETED":
                this.engine_task_wp_not_completed(args); // { wp }
                break;

            case "TASK_START":
                this.engine_task_start(args); // { wp, start_local_time_s, start_alt_m }
                break;

            case "TASK_START_TOO_LOW":
                this.engine_task_start_too_low(args); // { wp }
                break;

            case "TASK_START_TOO_HIGH":
                this.engine_task_start_too_high(args); // { wp }
                break;

            case "TASK_FINISH":
                this.engine_task_finish(args); // { wp }
                break;

            case "TASK_FINISH_TOO_LOW":
                this.engine_task_finish_too_low(args); // { wp }
                break;

            case "TASK_FINISH_TOO_HIGH":
                this.engine_task_finish_too_high(args); // { wp }
                break;

            default:
                console.log("lx9050 engine event unrecognized "+event_name, args);

        }
    }

    // Called by B21 Soaring Engine whenever current waypoint changes.
    // { "wp": wp }
    engine_task_wp_change(args) {
        console.log("lx9050 engine_task_wp_change", args);
        if (this.task_page_displayed) {
            this.task_page_content();
        }
        this.nav_display_refresh(0);
    }

    // { wp }
    engine_task_wp_completed(args) {
        console.log("lx9050 engine_task_wp_completed", args);
        let WP = args["wp"];
        this.message_task_wp_completed(WP);
    }

    // { wp} WP completed but prior waypoints not completed
    engine_task_wp_not_completed(args) {
        console.log("lx9050 engine_task_wp_not_completed", args);
        let WP = args["wp"];
        this.message_task_wp_not_completed(WP);
    }

    // { wp, start_local_time_s, start_alt_m}
    engine_task_start(args) {
        console.log("lx9050 engine_task_start", args);
        let WP = args["wp"];
        this.message_task_start(WP, args["start_local_time_s"], args["start_alt_m"]);
    }

    // { wp }
    engine_task_start_too_low(args) {
        console.log("lx9050 engine_task_start_too_low", args);
        let WP = args["wp"];
        this.message_task_start_too_low(WP);
    }

    // { wp }
    engine_task_start_too_high(args) {
        console.log("lx9050 engine_task_start_too_high", args);
        let WP = args["wp"];
        this.message_task_start_too_high(WP);
    }

    // { wp, finish_speed_ms, completion_time_s }
    engine_task_finish(args) {
        console.log("lx9050 engine_task_finish", args);
        let WP = args["wp"];
        this.message_task_finish(WP, args["finish_speed_ms"], args["completion_time_s"]);
    }

    // { wp }
    engine_task_finish_too_low(args) {
        console.log("lx9050 engine_task_finish_too_low", args);
        let WP = args["wp"];
        this.message_task_finish_too_low(WP);
    }

    // { wp }
    engine_task_finish_too_high(args) {
        console.log("lx9050 engine_task_finish_too_high", args);
        let WP = args["wp"];
        this.message_task_finish_too_high(WP);
    }

    // ***********************************************************************
    // ********** MSFS Map Initialization     ********************************
    // ***********************************************************************

    // load_map called from Update(), only executes once
    load_map() {
        // Map will be initialised on the 10th update cycle from aircraft load
        if (this.load_map_called == null || this.load_map_called < 10) {
            this.load_map_called = this.load_map_called == null ? 1 : this.load_map_called + 1;
            if (this.load_map_called == 10) { // this is experimental code to delay the
                // Map elements
                this.map_el = document.getElementById("Map");
                this.map_instrument = document.getElementById("MapInstrument"); // Asobo map
                if (this.map_instrument) {
                    this.ex=444; TemplateElement.call(this.map_instrument, this.onMapInstrumentLoaded.bind(this));
                } else {
                    this.debug_log("map_instrument load error");
                }
            }
        }
    }

    onMapInstrumentLoaded() {
        this.ex=445;
        this.map_instrument.init(this);

        this.set_zoom(7);

        this.ex=447;
        this.map_instrument_loaded = true;
    }

    init_map() {
        if (this.init_map_completed==null) {

            this.init_map_completed=true;
        }
    }

    // Update contents of the Map div, i.e. the MapInstrument, bing-map and Task overlay
    // Called from Update() only if this.map_instrument_loaded is true.
    update_map() {
        this.init_map();

        this.update_map_center();

        // this.ex=41;this.map_instrument.update(this.deltaTime);
        this.ex=42;
        // Before draw_task(), we need to check SvgMap (navMap) is ready after startup
        if (B21_SOARING_ENGINE.task_active() && this.map_instrument.navMap.centerCoordinates != null // &&
            // (this.update_map_time_s==null || this.update_map_time_s>this.TIME_S || this.TIME_S-this.update_map_time_s>0.3)) {
            //this.update_map_time_s = this.TIME_S;
            ) {
            NAVMAP.draw_task();
        }
    }

    // Adjust x,y position of map within gauge according to other elements displayed (e.g. attitude indicator)
    update_map_center() {
        // Detect if other content has changed, so we need to move the center of the map
        // Check Attitude Indicator
        if (this.prev_ai_y_offset_px==null || this.prev_ai_y_offset_px != this.dropdown_px) {
            this.prev_ai_y_offset_px = this.dropdown_px;
            console.log("update_map_center() AI offset change, nav_display_mode="+this.nav_display_mode);
            // this.change_map_center();
        }
        // Check Nav Data display
        if (this.prev_nav_y_offset_px==null || this.prev_nav_y_offset_px != this.nav_y_offset_px) {
            if (this.prev_nav_y_offset==null) { console.log("update_map_center() prev_nav_y_offset==null"); }
            this.prev_nav_y_offset_px = this.nav_y_offset_px;
            console.log("update_map_center() nav offset change, nav_display_mode="+this.nav_display_mode);
            // this.change_map_center();
        }
    }

    // Calculuate offsets for "Map" div to center the map at x,y px in 572x1024 gauge
    change_map_center() {
         let map_x_offset_px = (572 - this.MAP_SIZE) / 2; //-301;
         let map_y_ratio;
         if (this.map_rotation == EMapRotationMode.TrackUp) {
             console.log("Setting map center for TrackUp, nav_display_mode="+this.nav_display_mode);
             map_y_ratio = 0.15; // Center 10% up between bottom of AI and top of Nav Display
         } else {
             console.log("Setting map center for NorthUp, nav_display_mode="+this.nav_display_mode);
             map_y_ratio = 0.5; // Simply center between bottom of AI and top of Nav Display
         }
         let map_y_offset_px = (1-map_y_ratio) * this.nav_y_offset_px + map_y_ratio * this.dropdown_px - this.MAP_SIZE / 2;
         this.map_el.style.left = map_x_offset_px.toFixed(1)+"px";
         this.map_el.style.top = map_y_offset_px.toFixed(1)+"px";
    }

    draw_task() {
        this.ex="ut.1";
        let newSVG = document.createElementNS('http://www.w3.org/2000/svg','svg');
        newSVG.setAttribute("width","1000"); // note MapInstrument is hard-coded to 1000x1000px
        newSVG.setAttribute("height","1000");
        newSVG.setAttribute("id","lx_9050_task");

        this.ex="ut.3";

        for (let wp_index = 0; wp_index < B21_SOARING_ENGINE.task_length(); wp_index++) {
            this.ex="ut.4."+wp_index;

            this.ex="ut.4.1."+wp_index;
            // Draw line p1 -> p2 (solid for current leg, dashed for other legs)
            this.add_task_line(newSVG, wp_index);

            if (wp_index == B21_SOARING_ENGINE.task.start_index && B21_SOARING_ENGINE.task_index() <= B21_SOARING_ENGINE.task.start_index) {
                this.ex="ut.4.2."+wp_index;
                // Draw start line at this WP
                this.add_start_line(newSVG, wp_index);
            } else if (wp_index == B21_SOARING_ENGINE.task.finish_index) {
                this.ex="ut.4.3."+wp_index;
                this.add_finish_line(newSVG, wp_index);
            } else if (wp_index > B21_SOARING_ENGINE.task.start_index && wp_index < B21_SOARING_ENGINE.task.finish_index) {
                // Draw WP radius
                this.ex="ut.4.4."+wp_index;
                this.add_wp_radius(newSVG, wp_index);
            }

        }
        this.ex="ut.7";
        this.draw_range_circles(newSVG);

        this.ex="ut.8";
        this.map_overlay_el.removeChild(this.task_svg_el);
        this.task_svg_el = newSVG;
        this.map_overlay_el.appendChild(this.task_svg_el);
        this.ex="ut.9";
    }

    // Draw distance circles around next WP (between plane position and WP)
    draw_range_circles(svg_parent) {
        if (!B21_SOARING_ENGINE.task_active()) {
            return;
        }

        let wp_LL = B21_SOARING_ENGINE.current_wp().position;

        // Draw 5 range circles around current wp
        for (let i=0; i<5; i++) {
                let circle_distance_m = (i+1) * 10000; // 10 km range circles
                if (circle_distance_m > B21_SOARING_ENGINE.current_wp().distance_m) {
                    break;
                }
                let circle = this.svg_circle(wp_LL, (i+1) * 10000, 5, this.RANGE_COLOR) ;//, 30, 0) ;//this.RANGE_WIDTH, this.RANGE_COLOR, this.RANGE_DASH_SIZE, 0);
                svg_parent.appendChild(circle);
                /* circle = this.svg_circle(wp_LL, (i+1) * 10000, this.RANGE_WIDTH, this.RANGE_COLOR_ALT, this.RANGE_DASH_SIZE, this.RANGE_DASH_SIZE);
                svg_parent.appendChild(circle); */
        }
    }

    svg_circle(LL, radius_m, width, color) { //, dash_size=0, dash_offset=0) {
        let p1 = this.LL_to_XY(LL);
        // Draw circle around p1
        let circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
        circle.setAttribute('cx',p1.x);
        circle.setAttribute('cy',p1.y);
        let r = this.meters_to_px(radius_m);
        circle.setAttribute('r',Math.max(2,r).toFixed(0)); // make min radius 2px
        circle.setAttribute("stroke", color);
        circle.setAttribute("stroke-width", width);
        circle.setAttribute("fill", "none");

        return circle;

        // stroke-dasharray does not seem to be implemented
        // if (dash_size != 0) {
        //    circle.setAttribute("stroke-dasharray", dash_size+" "+dash_size);
        //    if (dash_offset > 0) {
        //        circle.setAttribute("stroke-dashoffset",dash_offset);
        //    }
        // }
        // return circle;
    }

    svg_arc(LL1, LL2, width, color) {
        let p1 = this.LL_to_XY(LL1);
        let p2 = this.LL_to_XY(LL2);
        let arc =  document.createElementNS('http://www.w3.org/2000/svg','path');

        let d_str = "M "+p1.x.toFixed(0)+" "+p1.y.toFixed(0); // Move to p1
        d_str += " A 1 1 0 0 0 "+p2.x.toFixed(0)+" "+p2.y.toFixed(0); // Draw arc p1..p2

        arc.setAttribute('d',d_str);

        arc.setAttribute("stroke", color);
        arc.setAttribute("stroke-width", width);
        arc.setAttribute("fill", "none");

        return arc;
    }

    add_task_line(svg_el, wp_index) {
        // Cannot add a task line for the first waypoint in the task
        if (wp_index==0) { //B21_SOARING_ENGINE.task_length()-1) {
            return;
        }

        // Don't add a task line before the start
        if (B21_SOARING_ENGINE.task.start_index != null && wp_index <= B21_SOARING_ENGINE.task.start_index) {
            return;
        }

        // Don't add task line after the finish line
        if(B21_SOARING_ENGINE.task.finish_index != null && wp_index > B21_SOARING_ENGINE.task.finish_index) {
            return;
        }

        let wp = B21_SOARING_ENGINE.task.waypoints[wp_index];

        // Check if we want to HIGHLIGHT this task line,
        // i.e. the line to the current waypoint (will choose color) or current WP is start and this is NEXT leg
        const current_task_line = wp_index == B21_SOARING_ENGINE.task_index() ||
                                (wp_index - 1 == B21_SOARING_ENGINE.task_index() && B21_SOARING_ENGINE.task.start_index == B21_SOARING_ENGINE.task_index()) ;

        const line_color = current_task_line ? this.TASK_LINE_CURRENT_COLOR : this.TASK_LINE_COLOR;

        const initial_offset = current_task_line ? (this.TIME_S % 4) / 2 * this.TASK_LINE_DASH_SIZE : 0;

        const line = this.svg_line( wp["position"],
                                    B21_SOARING_ENGINE.task.waypoints[wp_index-1]["position"],
                                    this.TASK_LINE_WIDTH,
                                    line_color,
                                    this.TASK_LINE_DASH_SIZE,
                                    initial_offset); // dash_offset
        svg_el.appendChild(line);

        const alt_color = current_task_line ? this.TASK_LINE_CURRENT_COLOR_ALT : this.TASK_LINE_COLOR_ALT;

        let alt_line = this.svg_line(   wp["position"],
                                        B21_SOARING_ENGINE.task.waypoints[wp_index-1]["position"],
                                        this.TASK_LINE_WIDTH,
                                        alt_color,
                                        this.TASK_LINE_DASH_SIZE,
                                        initial_offset + this.TASK_LINE_DASH_SIZE); // dash_offset
        svg_el.appendChild(alt_line);
    }

    add_wp_radius(svg_el, wp_index) {
        //console.log("add_wp_radius",wp_index);
        let wp = B21_SOARING_ENGINE.task.waypoints[wp_index];
        let wp_LL = wp.position;
        let radius_m = wp.radius_m;

        let circle = this.svg_circle(wp_LL, radius_m, 5, this.TASK_LINE_COLOR);
        svg_el.appendChild(circle);
    }

    // Draw a line perpendicular to the leg to the NEXT waypoint
    add_start_line(svg_el, wp_index) {
        //console.log("add_start_line()");
        // Cannot draw a start line on last waypoint
        if (wp_index >= B21_SOARING_ENGINE.task_length() - 1) {
            return;
        }

        let wp = B21_SOARING_ENGINE.task.waypoints[wp_index];

        const line_color = wp_index==B21_SOARING_ENGINE.task_index() ? this.TASK_LINE_CURRENT_COLOR : this.TASK_LINE_COLOR;
        const line_color_alt = wp_index==B21_SOARING_ENGINE.task_index() ? this.TASK_LINE_CURRENT_COLOR_ALT : this.TASK_LINE_COLOR_ALT;

        //this.debug_log("add_start_line "+wp_index+" "+wp["leg_start_p1"].lat);
        const line = this.svg_line( wp["leg_start_p1"],
                                    wp["leg_start_p2"],
                                    this.TASK_LINE_WIDTH,
                                    line_color,
                                    this.TASK_LINE_DASH_SIZE,
                                    0); // dash_offset
        svg_el.appendChild(line);

        let alt_line = this.svg_line(   wp["leg_start_p1"],
                                        wp["leg_start_p2"],
                                        this.TASK_LINE_WIDTH,
                                        line_color_alt,
                                        this.TASK_LINE_DASH_SIZE,
                                        this.TASK_LINE_DASH_SIZE); // dash_offset
        svg_el.appendChild(alt_line);

        let arc_el = this.svg_arc(  wp["leg_start_p1"],
                                    wp["leg_start_p2"],
                                    this.TASK_LINE_WIDTH,
                                    this.TASK_LINE_COLOR);

        svg_el.appendChild(arc_el);
    }

    // Draw a line perpendicular to the leg from the PREVIOUS waypoint
    add_finish_line(svg_el, wp_index) {
        // Cannot draw a finish line on the first waypoint
        if (wp_index==0) {
            return;
        }

        let wp = B21_SOARING_ENGINE.task.waypoints[wp_index];

        const line_color = wp_index==B21_SOARING_ENGINE.task_index() ? this.TASK_LINE_CURRENT_COLOR : this.TASK_LINE_COLOR;
        const line_color_alt = wp_index==B21_SOARING_ENGINE.task_index() ? this.TASK_LINE_CURRENT_COLOR_ALT : this.TASK_LINE_COLOR_ALT;

        //this.debug_log("add_start_line "+wp_index+" "+B21_SOARING_ENGINE.task.waypoints[wp_index]["leg_start_p1"].lat);
        const line = this.svg_line( wp["leg_finish_p1"],
                                    wp["leg_finish_p2"],
                                    this.TASK_LINE_WIDTH,
                                    line_color,
                                    this.TASK_LINE_DASH_SIZE,
                                    0); // dash_offset
        svg_el.appendChild(line);

        let alt_line = this.svg_line(   wp["leg_finish_p1"],
                                        wp["leg_finish_p2"],
                                        this.TASK_LINE_WIDTH,
                                        line_color_alt,
                                        this.TASK_LINE_DASH_SIZE,
                                        this.TASK_LINE_DASH_SIZE); // dash_offset
        svg_el.appendChild(alt_line);

        let arc_el = this.svg_arc(  wp["leg_finish_p2"],
                                    wp["leg_finish_p1"],
                                    this.TASK_LINE_WIDTH,
                                    this.TASK_LINE_COLOR);

        svg_el.appendChild(arc_el);
    }

    svg_line(LL1, LL2, width, color, dash_size=0, dash_offset=0) {
        let p1 = this.LL_to_XY(LL1);
        let p2 = this.LL_to_XY(LL2);
        this.ex="ut.6";
        let line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',p1.x);
        line.setAttribute('y1',p1.y);
        line.setAttribute('x2',p2.x);
        line.setAttribute('y2',p2.y);
        line.setAttribute("stroke", color)
        line.setAttribute("stroke-width", width);
        if (dash_size != 0) {
            line.setAttribute("stroke-dasharray", dash_size+" "+dash_size);
            if (dash_offset > 0) {
                line.setAttribute("stroke-dashoffset",dash_offset);
            }
        }

        return line;
    }

    // *******************************************************************************************************************
    // ********** Nav Data                                                            ************************************
    // *******************************************************************************************************************

    // Initialise nav
    init_nav() {
        if (this.init_nav_completed == null) {

            console.log("init_nav()");
            // current 'arrow' display status true=block, false=none
            this.nav_arrow_status =     [ true, true, true, true, true, true, true]; // block/none display status of -3,-2,-1,1,2,3
            // Map for which arrows should be displayed for -3..+3
            this.nav_arrow_pointers = [ [ true, true, true, true,false,false,false],    // -3
                                        [false, true, true, true,false,false,false],    // -2
                                        [false,false, true, true,false,false,false],    // -1
                                        [false,false,false, true,false,false,false],    //  0
                                        [false,false,false, true, true,false,false],    // +1
                                        [false,false,false, true, true, true,false],    // +2
                                        [false,false,false, true, true, true, true] ];  // +3

            // Nav Arrow track thresholds, i.e. how far off the correct track you need to be for each nav arrow to be shown.
            this.nav_pointer_3_deg = 50; // These offsets are in degrees
            this.nav_pointer_2_deg = 25;
            this.nav_pointer_1_deg = 5;  // Anything less than +/- 5 degrees off track will show 'straight' pointer

            //DEBUG TODO allow more than 7 waypoints on nav display
            this.MAX_NAV_DISPLAY_MODE = 8;
            this.nav_display_mode = 0;      // 0 = display nothing, 1 = display only arrows, N = display arrows + (N-1) waypoints

            this.init_nav_completed = true;
        }
    }

    // Called from "Update()"... update the nav page display (arrows, waypoints and 'xcsoar' numbers)
    update_nav() {
        this.ex=31;
        this.init_nav(); // Only runs once to initialize data values for Nav Data

        this.ex=32;
        if (B21_SOARING_ENGINE.task_active()) {
            this.ex=33;
            //DEBUG remove this.once entries
            this.once("update_nav",() => console.log("update_nav() task_active"));

            // Setup nav display layout for first time from task load
            if (this.nav_initial_setup == null) {
                this.ex=34;
                console.log("update_nav() initial setup, nav_display_mode="+this.nav_display_mode);
                this.nav_initial_setup = true;
                // Set up nav display
                this.nav_display_refresh(0);
            }
            this.ex=35;
            // Update nav display info
            if (this.nav_display_mode > 0) {
                this.update_nav_pointer();
            }
            if (this.nav_display_mode > 1) {
                this.ex=36;
                this.update_nav_waypoints();
            }
        } else {
            this.ex=37;
            document.getElementById("lx_9050_nav_waypoints").innerHTML = "NO TASK";
        }
        this.ex=39;
    }

    // nav_display_refresh(delta) will update this.nav_display_mode:
    //      0 : display nothing
    //      1 : display only arrows
    //      2..(B21_SOARING_ENGINE.task_length()+1) : display arrows plus N-1 waypoints
    // delta can be:
    //      -1 : user scrolling down
    //       0 : for nav info initialization
    //      +1 : user scrolling up
    // The actual displayed number of waypoints is set in this.nav_display_count.
    // This may be fewer than this.nav_display_mode if there are not
    // enough waypoints to display from B21_SOARING_ENGINE.task_index() to B21_SOARING_ENGINE.task_length()-1.
    nav_display_refresh(delta) {
        this.ex=781;
        console.log("nav_display_refresh("+delta+") nav_display_mode="+this.nav_display_mode+" this.nav_display_count="+this.nav_display_count);
        // Record current value of this.nav_display_mode so we can detect change and SetStoredData updated value
        let prev_nav_display_mode = this.nav_display_mode;

        // If user is scrolling to reduce waypoints, start with the count currently displayed.
        if (delta < 0) {
            this.nav_display_mode = this.nav_display_count;
        }
        // Increment or decrement this.nav_display_mode as intended
        this.nav_display_mode = this.nav_display_mode + delta;
        // Ensure 0 min value
        if (this.nav_display_mode < 0) {
            this.nav_display_mode = 0;
            return;
        }
        this.ex=783;
        // Also limit the 'mode' to the number of offsets for the nav display
        if (this.nav_display_mode > this.MAX_NAV_DISPLAY_MODE) {
            this.nav_display_mode = this.MAX_NAV_DISPLAY_MODE;
        }
        // nav_display_count is how many turnpoints to be DISPLAYED, which may be LESS than nav_display_mode
        this.nav_display_count = this.nav_display_mode;

        this.ex=785;
        // Limit the 'mode' to include all the waypoints but no more.
        if (B21_SOARING_ENGINE.task_active() &&
            this.nav_display_mode > B21_SOARING_ENGINE.task_length() - B21_SOARING_ENGINE.task_index() + 1) {
            this.nav_display_count = B21_SOARING_ENGINE.task_length() - B21_SOARING_ENGINE.task_index() + 1;
        }

        this.ex=787;
        // if pilot is scrolling to increase waypoints, limit mode to waypoint count
        if (delta == 1) {
            this.nav_display_mode = this.nav_display_count;
        }

        // Persist nav_display_mode if it has changed
        if (prev_nav_display_mode != this.nav_display_mode) {
            this.set_setting("nav_display_mode","LX_9050_NAV_DISPLAY_MODE", this.nav_display_mode);
        }

        //this.debug_log("nav_display_refresh "+this.nav_display_count +"/"+this.nav_display_mode + " ["+B21_SOARING_ENGINE.task_index()+"]");

        //DEBUG TODO design for B21_SOARING_ENGINE.task_active() == false
        this.ex=789;
        this.nav_wp_content();
    }

    // *************************************************************************************************
    // Update Nav arrows display
    // i.e. the left and right direction indicator arrows on the Nav Data display

    update_nav_pointer() {
        if (this.nav_display_mode == 0) {
            return;
        }
        let bearing_deg = B21_SOARING_ENGINE.current_wp().bearing_deg;
        let pointer = this.nav_bearing_to_pointer(bearing_deg);
        this.nav_display_pointer(pointer);
    }

    // Given a waypoint bearing, calculate the -3..+3 value for the pointer
    nav_bearing_to_pointer(wp_bearing) {
        // Get aircraft heading either from compass (if slow/stationary) or GPS TRACK
        let aircraft_heading;
        if (this.AIRSPEED_MS < 15) {
            aircraft_heading = this.PLANE_HEADING_DEG;
        } else {
            aircraft_heading = this.PLANE_TRACK_DEG;
        }

        // Convert aircraft_heading and wp_bearing into +180..-180 degrees offset of WP from aircraft heading (turn_deg)
        let heading_delta_deg =  aircraft_heading - wp_bearing;

        let left_deg;
        let right_deg;
        if (heading_delta_deg > 0) {
            left_deg = heading_delta_deg;
            right_deg = 360 - heading_delta_deg;
        } else {
            left_deg = heading_delta_deg + 360;
            right_deg = -heading_delta_deg;
        }
        let turn_deg;
        if (left_deg < right_deg) turn_deg = -left_deg;
        else turn_deg = right_deg;

        // Convert turn_deg to pointer value -3..+3 - note this is NOT linear.
        // We use the angle thresholds for the pointers set up in
        let pointer;
        if (turn_deg < -this.nav_pointer_3_deg) pointer = -3;
        else if (turn_deg < -this.nav_pointer_2_deg) pointer = -2;
        else if (turn_deg < -this.nav_pointer_1_deg) pointer = -1;
        else if (turn_deg < this.nav_pointer_1_deg) pointer = 0;
        else if (turn_deg < this.nav_pointer_2_deg) pointer = 1;
        else if (turn_deg < this.nav_pointer_3_deg) pointer = 2;
        else pointer = 3;

        return pointer;
    }

    // Update the nav display direction pointer arrows
    // pointer is -3 .. +3 (any other number means all)
    nav_display_pointer(pointer) {
        let new_status = this.nav_arrow_pointers[pointer+3];
        for (var i=0;i<new_status.length;i++) {
            let display = ""; // "" | "block" | "none"
            if (new_status[i] != this.nav_arrow_status[i]) {
                let pointer_id = this.nav_pointer_to_id(i-3);
                let pointer_el = document.getElementById(pointer_id);
                pointer_el.style.display = new_status[i] ? "block" : "none";
                this.nav_arrow_status[i] = new_status[i];
            }
        }
    }

    // Convert an arrow number -4 .. +4 into an element id to display.
    // Note current range is -3..+3 but kept this way for possible future update.
    nav_pointer_to_id(pointer) {
        if (pointer == -4) {
            return "lx_9050_nav_arrow_minus_4";
        } else if (pointer == -3) {
            return "lx_9050_nav_arrow_minus_3";
        } else if (pointer == -2) {
            return "lx_9050_nav_arrow_minus_2";
        } else if (pointer == -1) {
            return "lx_9050_nav_arrow_minus_1";
        } else if (pointer == 0) {
            return "lx_9050_nav_arrow_0";
        } else if (pointer == 1) {
            return "lx_9050_nav_arrow_plus_1";
        } else if (pointer == 2) {
            return "lx_9050_nav_arrow_plus_2";
        } else if (pointer == 3) {
            return "lx_9050_nav_arrow_plus_3";
        } else if (pointer == 4) {
            return "lx_9050_nav_arrow_plus_4";
        }
        return "lx_9050_nav_arrow_0";
    }

    // Return the required pixel y-offset for top of waypoint display, given 'count' arrow + waypoints displayed
    nav_display_y_offset_px(count) {
        // Absolute 'y' position of nav info for each "this.nav_display_mode" value
        const PAGE_HEIGHT = 1024;
        const CURRENT_WP_HEIGHT_4 = 155; // px height of current WP if 4 nav boxes
        const CURRENT_WP_HEIGHT_8 = 274; // px height of current WP if 8 nav boxes
        const WP_HEIGHT = 107;
        const ARROWS_HEIGHT = 114;

        let current_wp_height = this.nav_boxes=="4" ? CURRENT_WP_HEIGHT_4 : CURRENT_WP_HEIGHT_8;
        const ARROWS_CURRENT_WP = PAGE_HEIGHT - ARROWS_HEIGHT - current_wp_height;
        switch (count) {
            case 0:         // No Nav Display
                return 0;
            case 1:         // Arrows only
                return PAGE_HEIGHT - ARROWS_HEIGHT;
            case 2:         // Arrows + Current WP
                return ARROWS_CURRENT_WP;
            default:
                return ARROWS_CURRENT_WP - (count-2) * WP_HEIGHT;
        }

    }

    // *************************************************************************************************
    // CREATE Nav Waypoints Display
    // i.e. for the 'xcsoar' numbers boxes per waypoint on the Nav Data display
    // *************************************************************************************************

    nav_wp_content() {
        this.ex=771;
        console.log("lx9050 nav_wp_content "+this.nav_display_mode);

        const nav_el = document.getElementById("lx_9050_nav");
        const arrows_el = document.getElementById("lx_9050_nav_arrows");
        this.ex=772;
        // Hide nav display and return if nav_display_mode==0
        if (this.nav_display_mode == 0) {
            this.nav_y_offset_px = 1024;
            nav_el.style.display = "none";
            return;
        }
        this.ex=7735;
        arrows_el.style.display = "block";
        this.nav_y_offset_px = this.nav_display_y_offset_px(this.nav_display_count);
        this.ex=7736;
        nav_el.style.top = this.nav_y_offset_px+"px";

        this.ex=774;
        nav_el.style.display = "block";

        // Clear any current waypoints entries from Nav Data
        let waypoints_el = document.getElementById("lx_9050_nav_waypoints");
        while (waypoints_el.hasChildNodes()) {
            waypoints_el.removeChild(waypoints_el.lastChild);
        }
        this.ex=775;
        // nav_display_mode==1 => only the arrows
        if (this.nav_display_mode == 1) {
            return;
        }

        this.ex=777;
        // Display waypoints until either count==nav_display_count or wp_index==task.count()
        let wp_display_count = 0;
        let wp_index = B21_SOARING_ENGINE.task_index();
        while (wp_display_count < this.nav_display_count - 1 && wp_index < B21_SOARING_ENGINE.task_length()) {
            this.ex="778."+wp_index;
            //this.debug_log("iterate add_nav_wp "+wp_index);
            this.add_nav_wp(wp_index, waypoints_el);
            wp_index++;
            wp_display_count++;
        }
    }

    // Add Nav Data waypoint
    add_nav_wp(wp_index, waypoints_el) {
        this.ex="7781."+wp_index;
        //this.debug_log("add_nav_wp "+wp_index);
        let wp_el = document.createElement("div");
        wp_el.className = "lx_9050_nav_wp";
        if (wp_index == B21_SOARING_ENGINE.task_index()) {
            // Current WP
            wp_el.className = "lx_9050_nav_current_wp";
            //wp_el.style.backgroundColor = this.WP_SELECTED_COLOR;
        }

        this.ex="7782."+wp_index;
        this.add_nav_wp_title(wp_index, wp_el);
        this.ex="77821."+wp_index;
        this.add_nav_wp_limits(wp_index, wp_el);
        this.ex="7783."+wp_index;
        this.add_nav_wp_numbers(wp_index, wp_el);
        this.ex="7784."+wp_index;
        waypoints_el.appendChild(wp_el);
    }

    // Add Nav Data waypoint title, i.e. name and altitude
    add_nav_wp_title(wp_index, wp_el) {
        this.ex=77821;
        let wp = B21_SOARING_ENGINE.task.waypoints[wp_index];

        this.ex=77822;
        let wp_title_el = document.createElement("div");
        wp_title_el.className = "lx_9050_nav_wp_title";
        //if (wp_index == B21_SOARING_ENGINE.task_index()) {
        //    wp_title_el.style.backgroundColor = "#B5E485";
        //}
        wp_el.appendChild(wp_title_el);

        this.ex=77823;
        let wp_name_el = document.createElement("div");
        wp_name_el.className = "lx_9050_nav_wp_name";
        // Prepend "[St]" or "[Fin]" to wp_name as appropriate
        this.ex=778231;
        let name_str = wp.prefix_name();
        if (name_str.length > 20) {
            name_str = name_str.substring(0,19)+'...';
        }
        wp_name_el.innerHTML = name_str;
        this.ex=778232;
        wp_title_el.appendChild(wp_name_el);

        this.ex=77824;
        let wp_alt_el = document.createElement("div");
        wp_alt_el.className = "lx_9050_nav_wp_alt";
        wp_alt_el.innerHTML = this.altitude_units == "m" ? wp.alt_m.toFixed(0)+" M" : (wp.alt_m * this.M_TO_FEET).toFixed(0)+" FT";
        wp_title_el.appendChild(wp_alt_el);
        this.ex=77829;
    }

    // Add the Nav Display radius, min alt, max alt
    add_nav_wp_limits(wp_index, wp_el) {
        // Only show limits on current waypoint
        //DEBUG arrival height AGL calculate to wp.min_alt_m
        if (B21_SOARING_ENGINE.task_length()<2 || wp_index != B21_SOARING_ENGINE.task_index()) {
            return;
        }

        let wp = B21_SOARING_ENGINE.current_wp();

        if ( (B21_SOARING_ENGINE.task.start_index == null ||
                (   wp.index >= B21_SOARING_ENGINE.task.start_index &&
                    (B21_SOARING_ENGINE.task.finish_index == null || wp.index <= B21_SOARING_ENGINE.task.finish_index) )) &&
             ((wp.radius_m != null && wp.radius_m != 500) || wp.min_alt_m != null || wp.max_alt_m != null)) {
            console.log("nav display",wp.name,"radius: "+wp.radius_m,"min: "+wp.min_alt_m,"max: "+wp.max_alt_m);
            this.ex="2001.51."+wp_index;
            // Add WP radius, min/max alts
            let wp_limits_el = document.createElement("div");
            wp_limits_el.className = "lx_9050_nav_wp_limits";

            if (wp.radius_m != null) {
                this.ex="2001.52."+wp_index;
                let wp_radius_el = document.createElement("div");
                wp_radius_el.className = "lx_9050_task_page_wp_radius";
                wp_radius_el.innerHTML = "Radius:&nbsp;"+this.distance_str(wp.radius_m,1);
                wp_limits_el.appendChild(wp_radius_el);
            }

            this.ex="2001.53."+wp_index;
            if (wp.min_alt_m != null) {
                let wp_min_alt_el = document.createElement("div");
                wp_min_alt_el.className = "lx_9050_task_page_wp_min_alt";
                let min_alt_str = this.alt_str(wp.min_alt_m);
                wp_min_alt_el.innerHTML = "Min:&nbsp;"+min_alt_str;
                wp_limits_el.appendChild(wp_min_alt_el);
            }

            this.ex="2001.54."+wp_index;
            if (wp.max_alt_m != null) {
                let wp_max_alt_el = document.createElement("div");
                wp_max_alt_el.className = "lx_9050_task_page_wp_max_alt";
                let max_alt_str = this.alt_str(wp.max_alt_m);
                wp_max_alt_el.innerHTML = "Max:&nbsp;"+max_alt_str;
                wp_limits_el.appendChild(wp_max_alt_el);
            }

            wp_el.appendChild(wp_limits_el);
        }
    }

    // Add the 'xcsoar' numbers for this waypoint
    add_nav_wp_numbers(wp_index, wp_el) {
        let wp_numbers = document.createElement("div");
        wp_numbers.className = "lx_9050_nav_wp_numbers";
        wp_el.appendChild(wp_numbers);

        this.add_nav_wp_number(wp_index, wp_numbers, "distance", "DISTANCE", (this.distance_units=="km") ? "KM" : "MILES");
        this.add_nav_wp_number(wp_index, wp_numbers, "bearing", "BEARING", "°TRUE");
        this.add_nav_wp_number(wp_index, wp_numbers, "tailwind", "WIND (+/-)", (this.speed_units=="kph") ? "KM/H" : "KNOTS");
        const arrival_height_units = (this.altitude_units == "m" ? "M" : "FEET") + (this.arrival_height_basis=="msl" ? " MSL" : " AGL");
        this.add_nav_wp_number(wp_index, wp_numbers, "arrival_height", "ARRIVAL HEIGHT", arrival_height_units);

        // Add second row of numbers if this.nav_boxes=="8" & current waypoint
        if (this.nav_boxes=="8" && wp_index==B21_SOARING_ENGINE.task_index()) {
            let second_row = document.createElement("div");
            second_row.id = "lx_9050_nav_wp_row_2";
            wp_el.appendChild(second_row);

            this.add_nav_wp_number(wp_index, second_row, "task_time", "TASK TIME", "HH:MM:SS");
            this.add_nav_wp_number(wp_index, second_row, "task_speed", "TASK SPEED", (this.task_speed_units=="kph" ? "KM/H" : "MPH"));
            this.add_nav_wp_number(wp_index, second_row, "gr_required", "GR NEEDED", "RATIO");
            this.add_nav_wp_number(wp_index, second_row, "gr_now", "GR TO WP", "RATIO");
        }
    }

    // Create the content for the 'number' div for this waypoint & ref (i.e. distance, bearing etc.)
    // The div DOM object for each value will be stored as this.nav_wp_value_els[wp_index].ref
    add_nav_wp_number(wp_index, wp_numbers, ref, title, units) {

        // Create objects to persist value DOM object if they don't exist already
        if (this.nav_wp_value_els == null) {
            this.nav_wp_value_els = {};
        }

        if (this.nav_wp_value_els[wp_index] === undefined) {
            this.nav_wp_value_els[wp_index] = {};
        }

        let wp_number = document.createElement("div");
        wp_number.className = "lx_9050_nav_wp_"+ref;
        wp_numbers.appendChild(wp_number);

        // Add heading (and units) only to the current waypoint
        if (wp_index == B21_SOARING_ENGINE.task_index()) {
            let wp_number_title = document.createElement("div");
            wp_number_title.className = "lx_9050_nav_wp_number_title";
            wp_number_title.innerHTML = title;
            wp_number.appendChild(wp_number_title);
        }

        let wp_number_value_el = document.createElement("div");
        wp_number_value_el.className = "lx_9050_nav_wp_number_value";
        wp_number_value_el.innerHTML = "--";
        wp_number.appendChild(wp_number_value_el);
        // Store reference to value DOM object
        this.nav_wp_value_els[wp_index][ref] = wp_number_value_el;

        if (wp_index == B21_SOARING_ENGINE.task_index()) {
            let wp_number_units = document.createElement("div");
            wp_number_units.className = "lx_9050_nav_wp_number_units";
            wp_number_units.innerHTML = units;
            wp_number.appendChild(wp_number_units);
        }
    }

    // *************************************************************************************************
    // UPDATE the contents of the Nav Display boxes
    // *************************************************************************************************

    update_nav_waypoints() {
        this.ex=361;
        // Display waypoints until either count==nav_display_count or wp_index==task.count()
        let wp_display_count = 0;
        let wp_index = B21_SOARING_ENGINE.task_index();
        while (wp_display_count < this.nav_display_count - 1 && wp_index < B21_SOARING_ENGINE.task_length()) {
            this.ex=365;
            //this.debug_log("iterate add_nav_wp "+wp_index);
            this.update_nav_wp_display(wp_index);
            wp_index++;
            wp_display_count++;
        }
        this.ex=369;
    }

    update_nav_wp_display(wp_index) {
        this.ex=3651;
        let wp = B21_SOARING_ENGINE.task.waypoints[wp_index];

        // ****************************************************
        // Distance (around task to WP)

        let distance_el = this.nav_wp_value_els[wp_index]["distance"];
        let distance_m = wp.task_distance_m;
        let distance_str;
        let distance = (this.distance_units=="km") ? distance_m / 1000 : distance_m * this.M_TO_MILES;
        if (distance >= 100) {
            distance_str = distance.toFixed(0);
        } else {
            distance_str = distance.toFixed(1);
        }
        distance_el.innerHTML = distance_str;

        // ****************************************************
        // Bearing (either direct to current WP or along leg for next WP's)
        this.ex=3652;
        let bearing_el = this.nav_wp_value_els[wp_index]["bearing"];
        let bearing_deg;
        if (wp_index == B21_SOARING_ENGINE.task_index()) {
            bearing_deg = wp.bearing_deg; // For current WP use bearing direct to WP
        } else {
            bearing_deg = wp.leg_bearing_deg; // Other waypoints use leg WP->WP bearing
        }

        //let gr_actual = SimVar.GetSimVarValue("Z:B21_GLIDE_RATIO","number");
        //let gr_actual_str = gr_actual > 99 ? "+++" : gr_actual.toFixed(1);
        //bearing_el.innerHTML = gr_actual_str;
        bearing_el.innerHTML = bearing_deg.toFixed(0);

        // ****************************************************
        // Tailwind
        this.ex=3653;
        let tailwind_el = this.nav_wp_value_els[wp_index]["tailwind"];
        let tailwind_speed = wp.tailwind_ms * (this.speed_units=="kph" ? this.MS_TO_KPH : this.MS_TO_KNOTS);
        let tailwind_speed_str = tailwind_speed.toFixed(0);
        // Add a "+" to tailwind & clean up "-0"
        if (tailwind_speed_str=="-0") {
            tailwind_speed_str = "0";
        } else if (!tailwind_speed_str.startsWith("-") && tailwind_speed_str != "0") {
            tailwind_speed_str = "+" + tailwind_speed_str;
        }
        tailwind_el.innerHTML = tailwind_speed_str;

        // ****************************************************
        // Arrival height, display either MSL or AGL
        this.ex=3655;
        let arrival_height_el = this.nav_wp_value_els[wp_index]["arrival_height"];
        // Use either MSL or AGL, for AGL we subtract the elevation (alt_m) of the waypoint.
        let arrival_height = wp.arrival_height_msl_m - (this.arrival_height_basis == "msl" ? 0 : wp.alt_m)
        // Convert to feet or meters
        arrival_height = arrival_height * (this.altitude_units=="m" ? 1 : this.M_TO_FEET);
        // If arrival height is positive, add "+" to display string
        let plus_sign = arrival_height > 0 ? "+" : "";
        // If larger than +/-50, round to nearest 10.
        if (Math.abs(arrival_height) >= 50) {
            arrival_height = (arrival_height / 10).toFixed(0)+"0";
        } else {
            arrival_height = arrival_height.toFixed(0);
        }
        arrival_height_el.innerHTML = plus_sign + arrival_height;

        // ***********************************************************************************************
        // If we're on the task page, or current waypoint, or only have "4" anv boxes, we can return now
        // ***********************************************************************************************
        if (wp_index != B21_SOARING_ENGINE.task_index() || this.nav_boxes=="4") {
            this.ex=36591;
            return;
        }

        // ****************************************************
        // This is current waypoint with more than 4 nav boxes
        // task_time, task_speed, gr_required, gr_now
        // ****************************************************

        // ********************************
        // Time on task
        this.ex=36571;
        let task_duration_s = B21_SOARING_ENGINE.task_time_s();
        this.ex=365711;
        let task_time_str = this.time_str(task_duration_s); // Get time-on-task as HH:MM:SS
        this.ex=365712;
        if (task_time_str.startsWith("00:")) {
            this.ex=365713;
            task_time_str = task_time_str.slice(-5); // Remove the "00:"
        }
        this.ex=365714;
        let task_time_el = this.nav_wp_value_els[wp_index]["task_time"];
        this.ex=365715;
        task_time_el.innerHTML = task_time_str;

        // ********************************
        // Task Speed
        this.ex=36572;
        let task_speed_ms = 0;      // Speed around task in m/s
        let task_distance_m = 0;    // Distance around task in meters
        if (B21_SOARING_ENGINE.task_started() && B21_SOARING_ENGINE.task_time_s() > 5) {
            this.ex=365721;
            // We calculate "distance around task" as (cumulative leg distances start to current wp) - (distance to current wp).
            for (let i=B21_SOARING_ENGINE.task.start_index+1;i<=wp_index;i++) {
                task_distance_m += B21_SOARING_ENGINE.task.waypoints[i].leg_distance_m;
            }

            this.ex=365723;
            // If task distance is negative, we'll use zero
            task_distance_m = Math.max(0, task_distance_m - wp.distance_m);

            this.ex=365724;
            task_speed_ms = task_distance_m / B21_SOARING_ENGINE.task_time_s();
        }
        SimVar.SetSimVarValue("Z:B21_TASK_DISTANCE_M","meters", task_distance_m);
        SimVar.SetSimVarValue("Z:B21_TASK_SPEED_MS","meters per second", task_speed_ms);

        let task_speed = task_speed_ms * (this.task_speed_units=="kph" ? this.MS_TO_KPH : this.MS_TO_KNOTS);
        let task_speed_str = task_speed > 999 ? "999" : task_speed.toFixed(0);
        let task_speed_el = this.nav_wp_value_els[wp_index]["task_speed"];
        task_speed_el.innerHTML = task_speed_str;

        // ********************************
        // Glide Ratio Required
        this.ex=36573;
        let gr_required_el = this.nav_wp_value_els[wp_index]["gr_required"];
        let height_needed_m = this.ALTITUDE_M - wp.alt_m;
        let gr_required = height_needed_m <= 0 ? 1000 : wp.distance_m / height_needed_m;
        let gr_required_str = gr_required > 999 ? "+++" : gr_required.toFixed(0);
        gr_required_el.innerHTML = gr_required_str;

        // ********************************
        // Glide Ratio Now (from S100)
        this.ex=36574;
        let gr_now_el = this.nav_wp_value_els[wp_index]["gr_now"];
        this.ex=365741;
        let ground_speed_ms = SimVar.GetSimVarValue("A:GPS GROUND SPEED","meters per second");
        this.ex=365742;
        let ground_track_true_deg = SimVar.GetSimVarValue("A:GPS GROUND TRUE TRACK","degrees");
        this.ex=365743;
        let gr_bearing_deg = wp.bearing_deg;
        this.ex=365744;
        let vmg_ms = ground_speed_ms * Math.cos(Geo.DEG_TO_RAD(gr_bearing_deg - ground_track_true_deg));
        this.ex=365745;
        //SimVar.SetSimVarValue("Z:B21_WP_BEARING_DEG","degrees", gr_bearing_deg);
        //SimVar.SetSimVarValue("Z:B21_WP_VMG_MS","meters per second", vmg_ms);

        // The current glide ratio is produced by the model XML
        let gr_now = SimVar.GetSimVarValue("Z:B21_GLIDE_RATIO","number") // this 'live' L/D ratio
        //let te_smoothed_ms = SimVar.GetSimVarValue("Z:B21_TE_SMOOTHED_MS","number"); // sink is -ve
        //let gr_now = te_smoothed_ms >= 0 ? 100 : -vmg_ms / te_smoothed_ms;
        let gr_now_str = gr_now > 99 ? "+++" : gr_now.toFixed(0);
        gr_now_str = vmg_ms < 0 ? "---" : gr_now_str;
        gr_now_el.innerHTML = gr_now_str;

        this.ex=36592;
    }

    // ***********************************************************************
    // ********** Task Message Management         ****************************
    // ***********************************************************************

    init_task_message() {
        this.task_message_el = document.getElementById("lx_9050_task_message");

        this.task_message_el.style.display = "none";

        this.task_message_displayed = false; // True => task message is currently visible.
        this.task_message_time_s = 0; // Absolute time message was displayed, set in task_message()
        this.task_message_duration = 3;      // update_task_wp_switch() will hide message after these seconds.

        this.init_task_wp_switch_completed = true; // run once;
    }

    update_task_message() {
        if (this.init_task_message_complete == null) {
            this.init_task_message();
            this.init_task_message_complete = true;
        }
        // Hide task message after this.task_message_duration seconds
        if ( this.task_message_displayed &&
            (this.TIME_S < this.task_message_time_s || this.TIME_S > this.task_message_time_s + this.task_message_duration)) {
            this.task_message_el.style.display = "none";
            this.task_message_displayed = false;
        }

    }

    // Display a task message for 'msg_duration' seconds.
    // The message will be hidden by update_task_wp_switch()
    task_message(msg_str, msg_duration, nok=false) {
        this.task_message_el.className = nok ? "lx_9050_message_nok" : "lx_9050_message_ok";
        this.task_message_el.innerHTML = msg_str;
        this.task_message_el.style.display = "block";
        this.task_message_displayed = true;
        this.task_message_time_s = this.TIME_S; // Set start time for update_task_message();
        this.task_message_duration = msg_duration;
    }

    // ***********************************************************************************
    // *************** LX 9050 Popup Messages                          *******************
    // ***********************************************************************************
    //  this.message_task_wp_completed(WP);
    //  this.message_task_wp_not_completed(WP);
    //  this.message_task_start(WP, start_local_time_s, start_alt_m);
    //  this.message_task_start_too_low(WP);
    //  this.message_task_start_too_high(WP);
    //  this.message_task_finish(WP, finish_speed_ms, completion_time_s);
    //  this.message_task_finish_too_low(WP);
    //  this.message_task_finish_too_high(WP);

    // Start the task
    message_task_start(wp, start_local_time_s, start_alt_m) {
        // Display "TASK START" message
        let msg_str = "TASK STARTED ";
        msg_str += this.time_str(start_local_time_s)+"<br/>";
        msg_str += wp.name+"<br/>";
        msg_str += this.alt_str(start_alt_m);
        this.task_message(msg_str, 5); // Display start message for 5 seconds
    }

    message_task_start_too_low(wp) {
        // Display started too low message
        let msg_str = "BAD START";
        msg_str += "<br/>" + this.alt_str(this.ALTITUDE_M);
        msg_str += "<br/>&gt;&gt;&nbsp;TOO LOW&nbsp;&lt;&lt;";
        msg_str += "<br/>MIN HEIGHT: " + this.alt_str(wp.min_alt_m);
        this.task_message(msg_str, 6, true); // Display start message for 5 seconds
    }

    message_task_start_too_high(wp) {
        // Display started too low message
        let msg_str = "BAD START";
        msg_str += "<br/>" + this.alt_str(this.ALTITUDE_M);
        msg_str += "<br/>&gt;&gt;&nbsp;TOO HIGH&nbsp;&lt;&lt;";
        msg_str += "<br/>MAX HEIGHT: " + this.alt_str(wp.max_alt_m);
        this.task_message(msg_str, 6, true); // Display start message for 5 seconds
    }

    message_task_wp_completed(wp) {
        this.task_message(wp.name+" OK",2);
    }

    message_task_wp_not_completed(wp) {
        this.task_message(wp.name+"<br/>NOT TASK",3,true);
    }

    message_task_finish(wp, finish_speed_ms, completion_time_s) {
        // Display "TASK COMPLETED" message
        let msg_str = "TASK COMPLETED ";
        msg_str += this.task_speed_str(finish_speed_ms)+"<br/>";
        msg_str += this.time_str(this.LOCAL_TIME_S)+"<br/>";
        msg_str += wp.name+"<br/>";
        msg_str += "SEE TASK PAGE.";
        this.task_message(msg_str, 10); // Display start message for 3 seconds
    }

    message_task_finish_too_low(wp) {
        // Display finished too low message
        let msg_str = "BAD FINISH";
        msg_str += "<br/>" + this.alt_str(this.ALTITUDE_M);
        msg_str += "<br/>&gt;&gt;&nbsp;TOO LOW&nbsp;&lt;&lt;";
        msg_str += "<br/>MIN HEIGHT: " + this.alt_str(wp.min_alt_m);
        this.task_message(msg_str, 6, true); // Display start message for 5 seconds
    }

    message_task_finish_too_high(wp) {
        // Display started too low message
        let msg_str = "BAD FINISH";
        msg_str += "<br/>" + this.alt_str(this.ALTITUDE_M);
        msg_str += "<br/>&gt;&gt;&nbsp;TOO HIGH&nbsp;&lt;&lt;";
        msg_str += "<br/>MAX HEIGHT: " + this.alt_str(wp.max_alt_m);
        this.task_message(msg_str, 6, true); // Display start message for 5 seconds
    }

    // Return MSFS local time (seconds) as [HH:]MM:SS
    time_str(time_s) {
        const ss = ("0"+Math.floor(time_s % 60)).slice(-2);
        const mm = ("0"+Math.floor(time_s % 3600 / 60) ).slice(-2);
        const hh = ("0"+Math.floor(time_s / 3600) ).slice(-2);
        return hh+":"+mm+":"+ss;
    }

    alt_str(alt_m) {
        let units_str = "M";
        let units_factor = 1;
        if (this.altitude_units != "m") {
            units_str = "FT";
            units_factor = this.M_TO_FEET;
        }
        units_str = '<div class="lx_9050_task_page_small">'+units_str+"</div>";
        return (alt_m * units_factor).toFixed(0)+"&nbsp;"+units_str;
    }

    distance_str(distance_m, digits=1) {
        let units_str = "KM";
        let units_factor = 0.001;
        if (this.distance_units != "km") {
            units_str = "MILES";
            units_factor = this.M_TO_MILES;
        }
        units_str = '<div class="lx_9050_task_page_small">'+units_str+"</div>";

        return (distance_m * units_factor).toFixed(digits)+"&nbsp;"+units_str;
    }

    task_speed_str(speed_ms) {
        let units_str = "KPH";
        let units_factor = this.MS_TO_KPH;
        if (this.task_speed_units != "kph") {
            units_str = "KNOTS";
            units_factor = this.MS_TO_KNOTS;
        }
        units_str = '<div class="lx_9050_task_page_small">'+units_str+"</div>";
        let speed = speed_ms * units_factor;
        if (speed > 999.9) {
            speed = 999.9;
        }
        return speed.toFixed(1)+"&nbsp;"+units_str;
    }

    // ***********************************************************************
    // ********** Task Page               ************************************
    // ***********************************************************************

    init_task_page() {
        if (this.init_task_page_completed==null) {

            this.task_page_el = document.getElementById("lx_9050_task_page");
            this.task_page_header_el = document.getElementById("lx_9050_task_page_header");
            this.task_page_header_finished_el = document.getElementById("lx_9050_task_page_header_finished");
            this.task_page_content_el = document.getElementById("lx_9050_task_page_content");
            this.task_page_footer_el = document.getElementById("lx_9050_task_page_footer");

            this.task_page_finish_select_mode = false; // Bool if we are in FINISH SELECT MODE

            this.task_page_displayed = false;

            this.init_task_page_completed = true;
        }
    }

    // Called from Update() once map is loaded
    update_task_page() {
        this.init_task_page();

    }

    task_page_show() {
        this.task_page_finish_select_mode = false;
        this.task_page_content();
        this.task_page_el.style.display = "block";
        this.task_page_displayed = true;
    }

    task_page_hide() {
        this.task_page_el.style.display = "none";
        this.task_page_displayed = false;
    }

    task_page_toggle() {
        if (this.task_page_displayed) {
            this.task_page_hide();
        } else {
            this.task_page_show();
        }
    }

    // Build the task page content
    task_page_content() {
        this.ex=101;
        // Display simple message if no task actually loaded
        if (!B21_SOARING_ENGINE.task_active()) {
            this.task_page_header_el.innerHTML = "NO TASK LOADED";
            this.task_page_header_finished_el.innerHTML = "";
            this.task_page_content_el.innerHTML = "";
            this.task_page_footer_el.innerHTML = "";
            return;
        }

        let alert_str = "";
        if (this.SIM_TIME_PAUSED || this.SIM_TIME_SLEWED || this.SIM_TIME_NEGATIVE || this.SIM_TIME_ENGINE) {
            let alert_msg = this.SIM_TIME_PAUSED ? "+PAUSED " : "";
            alert_msg += this.SIM_TIME_SLEWED ? "+SLEWED " : "";
            alert_msg += this.SIM_TIME_NEGATIVE ? "+TIME_SLIDE " : "";
            alert_msg += this.SIM_TIME_ENGINE ? "+MOTOR" : "";
            alert_str = '<br/><div class="lx_9050_task_page_small">ALERT: '+alert_msg+'</div>';
        }

        if (!B21_SOARING_ENGINE.task_started()) {
            this.ex=102;
            this.task_page_content_header("TASK PRE-START"+alert_str);
            this.ex=1022;
            this.task_page_header_finished_el.innerHTML = "";
        } else if (!B21_SOARING_ENGINE.task_finished()) {
            this.ex=103;
            this.task_page_content_header("TASK STARTED"+alert_str);
            this.task_page_header_finished_el.innerHTML = "";
        } else {
            this.ex=104;
            this.task_page_content_header("TASK COMPLETED"+alert_str);
            this.ex=105;
            this.task_page_content_finished();
        }
        this.ex=106;
        // Remove current content of task_page_content div
        while (this.task_page_content_el.firstChild) {
            this.task_page_content_el.removeChild(this.task_page_content_el.firstChild);
        }
        this.ex=107;
        // Add all waypoint entries
        this.task_page_content_wps(this.task_page_content_el);

        this.ex=108;
        // Add task page footer
        this.task_page_content_footer();

        this.ex=109;
    }

    task_page_content_header(title_str) {
        this.ex=10211;
        // Remove current content of task_page_header div
        while (this.task_page_header_el.firstChild) {
            this.task_page_header_el.removeChild(this.task_page_header_el.firstChild);
        }
        let date_el = document.createElement("div");
        date_el.id = "lx_9050_task_page_date";
        date_el.innerHTML = (new Date()).toString().slice(0,33); // Thu Jul 29 2021 11:35:50 GMT+0100
        this.task_page_header_el.appendChild(date_el);

        let title_el = document.createElement("div");
        title_el.id = "lx_9050_task_page_title";
        title_el.innerHTML = title_str;
        this.task_page_header_el.appendChild(title_el);

        this.ex=10219;
    }

    // Build the task page content for all waypoints and append those to parent_el
    task_page_content_wps(parent_el) {
        this.ex="wp100"
        for (let wp_index=0; wp_index<B21_SOARING_ENGINE.task_length(); wp_index++) {
            this.ex="wp100."+wp_index;
            this.task_page_content_wp(wp_index, parent_el);
        }
        this.ex="wp109";
    }

    // Build the task page content for a given WP on task, and add it to parent_el.
    task_page_content_wp(wp_index, parent_el) {
        this.ex="1001.1."+wp_index;
        let wp = B21_SOARING_ENGINE.task.waypoints[wp_index];
        let wp_el = document.createElement("div");
        wp_el.className = "lx_9050_task_page_wp";
        if (wp_index < B21_SOARING_ENGINE.task.start_index || wp_index > B21_SOARING_ENGINE.task.finish_index) {
            wp_el.style.backgroundColor = this.WP_NON_TASK_COLOR; // Set waypoints before start / after finish with gray background
        }

        // WP BEARING DISTANCE

        this.ex="1001.2."+wp_index;
        if (wp_index > B21_SOARING_ENGINE.task.start_index) {
            this.ex="1001.21."+wp_index;
            // Add WP bearing and distance
            let bearing_distance_el = document.createElement("div");
            bearing_distance_el.className = "lx_9050_task_page_wp_bearing_distance";

            this.ex="1001.22."+wp_index;
            let wp_bearing_el = document.createElement("lx_9050_task_page_wp_bearing");
            wp_bearing_el.className = "lx_9050_task_page_wp_bearing";
            wp_bearing_el.innerHTML = wp.leg_bearing_deg.toFixed(0) + "°";
            bearing_distance_el.appendChild(wp_bearing_el);

            this.ex="1001.23."+wp_index;
            let wp_distance_el = document.createElement("lx_9050_task_page_wp_distance");
            wp_distance_el.className = "lx_9050_task_page_wp_distance";
            wp_distance_el.innerHTML = this.distance_str(wp.leg_distance_m);
            bearing_distance_el.appendChild(wp_distance_el);

            // Add completion info
            if (wp.leg_is_completed) {
                this.ex="1001.24."+wp_index;
                let completed_el = document.createElement("div");
                completed_el.className = "lx_9050_task_page_wp_completed";
                let wp_speed_str = this.task_speed_str(wp.leg_speed_ms);
                completed_el.innerHTML = wp_speed_str;
                bearing_distance_el.appendChild(completed_el);

                this.ex="1001.25."+wp_index;
                let completed_ok_el = document.createElement("div");
                completed_ok_el.className = "lx_9050_task_page_wp_ok";
                completed_ok_el.innerHTML = "OK";
                bearing_distance_el.appendChild(completed_ok_el);
            }

            wp_el.appendChild(bearing_distance_el);
        }

        // WP TITLE

        this.ex="1001.3."+wp_index;
        // Add WP name and alt
        let wp_title_el = document.createElement("div");
        wp_title_el.className = "lx_9050_task_page_wp_title";
        if (wp_index == B21_SOARING_ENGINE.task_index()) {
            wp_title_el.style.backgroundColor = this.WP_SELECTED_COLOR;
        }

        this.ex="1001.4."+wp_index;
        let wp_name_el = document.createElement("div");
        wp_name_el.className = "lx_9050_task_page_wp_name";
        wp_name_el.innerHTML = wp.prefix_name();
        wp_title_el.appendChild(wp_name_el);

        this.ex="1001.5."+wp_index;
        let wp_alt_el = document.createElement("div");
        wp_alt_el.className = "lx_9050_task_page_wp_alt";
        let alt_str = this.alt_str(wp.alt_m);
        wp_alt_el.innerHTML = alt_str;
        wp_title_el.appendChild(wp_alt_el);

        wp_el.appendChild(wp_title_el);

        // WP LIMITS

        if ( (B21_SOARING_ENGINE.task.start_index == null ||
                (   wp.index >= B21_SOARING_ENGINE.task.start_index &&
                    (B21_SOARING_ENGINE.task.finish_index == null || wp.index <= B21_SOARING_ENGINE.task.finish_index) )) &&
             (wp.radius_m != null || wp.min_alt_m != null || wp.max_alt_m != null)) {
            console.log("task page",wp.name,"r: "+wp.radius_m+" min: "+wp.min_alt_m+" max: "+wp.max_alt_m);
            this.ex="1001.51."+wp_index;
            // Add WP radius, min/max alts
            let wp_limits_el = document.createElement("div");
            wp_limits_el.className = "lx_9050_task_page_wp_limits";

            if (wp.radius_m != null) {
                this.ex="1001.52."+wp_index;
                let wp_radius_el = document.createElement("div");
                wp_radius_el.className = "lx_9050_task_page_wp_radius";
                wp_radius_el.innerHTML = "Radius:&nbsp;"+this.distance_str(wp.radius_m,1);
                wp_limits_el.appendChild(wp_radius_el);
            }

            this.ex="1001.53."+wp_index;
            if (wp.min_alt_m != null) {
                let wp_min_alt_el = document.createElement("div");
                wp_min_alt_el.className = "lx_9050_task_page_wp_min_alt";
                let min_alt_str = this.alt_str(wp.min_alt_m);
                wp_min_alt_el.innerHTML = "Min:&nbsp;"+min_alt_str;
                wp_limits_el.appendChild(wp_min_alt_el);
            }

            this.ex="1001.54."+wp_index;
            if (wp.max_alt_m != null) {
                let wp_max_alt_el = document.createElement("div");
                wp_max_alt_el.className = "lx_9050_task_page_wp_max_alt";
                let max_alt_str = this.alt_str(wp.max_alt_m);
                wp_max_alt_el.innerHTML = "Max:&nbsp;"+max_alt_str;
                wp_limits_el.appendChild(wp_max_alt_el);
            }

            wp_el.appendChild(wp_limits_el);
        }

        // STARTED

        // Add content to START WP if task is STARTED
        if (B21_SOARING_ENGINE.task_started() && wp_index==B21_SOARING_ENGINE.task.start_index) {
            this.ex="1001.6.1."+wp_index;
            let started_el = document.createElement("div");
            started_el.id = "lx_9050_task_page_started";

            this.ex="1001.6.2."+wp_index;
            let started_info_el = document.createElement("div");
            started_info_el.id = "lx_9050_task_page_started_info";
            let start_time_str = this.time_str(B21_SOARING_ENGINE.task.start_local_time_s);
            let start_alt_str = this.alt_str(B21_SOARING_ENGINE.task.start_alt_m);
            started_info_el.innerHTML = start_time_str+"&nbsp;&nbsp;"+start_alt_str;
            started_el.appendChild(started_info_el);

            this.ex="1001.6.3."+wp_index;
            let started_ok_el = document.createElement("div");
            started_ok_el.className = "lx_9050_task_page_wp_ok";
            started_ok_el.innerHTML = "OK";
            started_el.appendChild(started_ok_el);

            wp_el.appendChild(started_el);
        }

        // Add content to FINISH WP if task is FINISHED
        if (B21_SOARING_ENGINE.task_finished() && wp_index==B21_SOARING_ENGINE.task.finish_index) {
            this.ex="1001.6.1."+wp_index;
            let finished_el = document.createElement("div");
            finished_el.id = "lx_9050_task_page_finished";

            this.ex="1001.6.2."+wp_index;
            let finished_info_el = document.createElement("div");
            finished_info_el.id = "lx_9050_task_page_finished_info";
            let finish_time_str = this.time_str(B21_SOARING_ENGINE.task.finish_local_time_s);
            let finish_alt_str = this.alt_str(B21_SOARING_ENGINE.task.finish_alt_m);
            finished_info_el.innerHTML = finish_time_str+"&nbsp;&nbsp;"+finish_alt_str;
            finished_el.appendChild(finished_info_el);

            wp_el.appendChild(finished_el);
        }


        parent_el.appendChild(wp_el);
        this.ex="1001.9."+wp_index;
    }

    task_page_content_footer() {
        this.ex ="t.foot";
        let start_index = B21_SOARING_ENGINE.task.start_index==null ? 0 : B21_SOARING_ENGINE.task.start_index;
        let finish_index = B21_SOARING_ENGINE.task.finish_index==null ? B21_SOARING_ENGINE.task.waypoints.length-1 : B21_SOARING_ENGINE.task.finish_index;
        let distance_m = 0;
        for (let i=start_index+1;i<=finish_index;i++) {
            this.ex="t.foot."+i;
            distance_m += B21_SOARING_ENGINE.task.waypoints[i].leg_distance_m;
        }
        this.task_page_footer_el.innerHTML = "Task distance: "+this.distance_str(distance_m);
    }

    task_page_content_finished() {
        this.ex="1002.1";
        // Remove current content of task_page_footer div
        while (this.task_page_header_finished_el.firstChild) {
            this.task_page_header_finished_el.removeChild(this.task_page_header_finished_el.firstChild);
        }
        if (B21_SOARING_ENGINE.task_finished()) {
            this.ex="1002.2";
            let distance_str = this.distance_str(B21_SOARING_ENGINE.task.distance_m());
            let speed_str = this.task_speed_str(B21_SOARING_ENGINE.task.finish_speed_ms);
            let time_str = this.time_str(B21_SOARING_ENGINE.task.finish_time_s - B21_SOARING_ENGINE.task.start_time_s);
            // Remove leading "00:"
            if (time_str.startsWith("00:")) {
                time_str = time_str.slice(3);
            }
            // Remove leading "0"
            if (time_str.startsWith("0")) {
                time_str = time_str.slice(1);
            }
            this.task_page_header_finished_el.innerHTML = distance_str + "&nbsp;&nbsp;"+time_str+"&nbsp;&nbsp;"+speed_str;
        }
        this.ex="1002.9";
    }

    // Set the current waypoint as the TASK START
    task_set_start_finish_wp() {
        if (B21_SOARING_ENGINE.task_active()) {

            this.init_sim_time();
            this.init_task_wp_switch();
            B21_SOARING_ENGINE.task.reset_start();

            if (B21_SOARING_ENGINE.task_index() == B21_SOARING_ENGINE.task.finish_index) {
                // ENTER FINISH SELECT MODE
                this.task_message("Select new FINISH waypoint",3);
                this.task_page_finish_select_mode = true;
            } else if (this.task_page_finish_select_mode) {
                // UPDATE FINISH LINE and exit finish select mode
                B21_SOARING_ENGINE.task.finish_index = B21_SOARING_ENGINE.task_index();
                this.task_page_finish_select_mode = false;
            } else {
                // UPDATE START LINE
                B21_SOARING_ENGINE.task.start_index = B21_SOARING_ENGINE.task_index();
            }

            // Update task page & nav WP's display
            if (this.task_page_displayed) {
                this.task_page_content();
            }
            this.nav_wp_content();
        }
    }

    // ***********************************************************************
    // ********** Attitude Indicator      ************************************
    // ***********************************************************************

    init_ai() {
        if (this.init_ai_complete == null) {

            this.ai_el = document.getElementById("lx_9050_ai");
            this.ai_bank_el = document.getElementById("lx_9050_ai_bank");
            this.ai_pitch_el = document.getElementById("lx_9050_ai_pitch");

            this.init_ai_complete = true;
        }
    }

    update_ai() {
        this.init_ai();

        if (!this.button_1_status=="ai") {
            return;
        }

        this.ai_bank_el.style.transform = "rotate("+this.BANK_DEG.toFixed(1)+"deg)";
        this.ai_pitch_el.style.transform = "translateY("+(-630 - this.PITCH_DEG * 824/80).toFixed(1)+"px)";

        return;
    }

    ai_hide() {
        this.ai_el.style.display = "none";
    }

    ai_show() {
        this.ai_el.style.display = "block";
    }

    // **********************************************************************
    // Task interaction
    // **********************************************************************

    // Called when the pilot scrolls the LX 9050 "change current wp" knob
    change_waypoint(delta) {
        console.log("lx9050 change wp "+delta);
        // Send change WP request to B21_SOARING_ENGINE without the default scroll around start/end of task.
        let current_wp_index = B21_SOARING_ENGINE.task_index();
        if ((delta < 0 && current_wp_index > 0) || (delta > 0 && current_wp_index < B21_SOARING_ENGINE.task_length() - 1)) {
            B21_SOARING_ENGINE.change_wp(delta)
        }
    }

    get_position() {
        return new LatLong(SimVar.GetSimVarValue("A:PLANE LATITUDE", "degrees latitude"),
                           SimVar.GetSimVarValue("A:PLANE LONGITUDE", "degrees longitude"));
    }

    display_zoom() {
        let zoom_index = this.get_zoom();
        this.knob_2_el.innerHTML = "Zoom "+zoom_index;
    }

    // ***********************************************************************
    // ********** Functions that interact with MSFS Maps   *******************
    // ***********************************************************************
    toggleIsolines() {
        if (this.map_instrument) {
            if (this.map_instrument.getIsolines() == true)
                this.map_instrument.showIsolines(false);
            else
                this.map_instrument.showIsolines(true);
        }
    }

    getIsolines() { return this.map_instrument.getIsolines(); }

    // Smoothly move map x px (+ve is East) and y px (+ve is South)
    scroll_map(x,y) {
        this.map_instrument.eBingMode = EBingMode.VFR;
        this.map_instrument.scrollMap(x,y);
    }

    set_center(LL) {
        this.map_instrument.setCenter(LL);
    }

    set_map_rotation(rotation) {
        switch (rotation) {
            case EMapRotationMode.NorthUp:
                this.ex=451;
                console.log("Setting map rotation to NorthUp");
                try {
                    this.map_rotation = EMapRotationMode.NorthUp;
                    this.map_instrument.setRotationMode(this.map_rotation);
                    document.getElementById("lx_9050_knob_overlay_1").innerHTML = "North Up";
                } catch (e) {
                    console.log("setRotationMode NorthUp error",e);
                }
                break;

            case EMapRotationMode.TrackUp:
                this.ex=452;
                console.log("Setting map rotation to TrackUp");
                try {
                    this.map_rotation = EMapRotationMode.TrackUp;
                    this.map_instrument.setRotationMode(this.map_rotation);
                    document.getElementById("lx_9050_knob_overlay_1").innerHTML = "Track Up";
                } catch (e) {
                    console.log("setRotationMode TrackUp error",e);
                }
                break;

            default:
                this.ex = "MapRot";
                throw "Map Rotation Error";
        }

        this.change_map_center();
    }

    // Convert distance in meters to on-screen pixel distance
    meters_to_px(m) {
        return this.map_instrument.navMap.NMToPixels(m * this.M_TO_NM);
    }

    // Convert LatLong object to {"x":.. , "y":..} pixels
    LL_to_XY(LL) {
        let p;
        // The navMap may not be ready yet after load, if so return temp value 0,0
        try {
            p = this.map_instrument.navMap.coordinatesToXY(LL);
        } catch (e) {
            console.log(e);
            return { x: 0, y: 0};
        }
        return p;
    }

    follow_plane() {
        this.map_instrument.eBingMode = EBingMode.PLANE;
        this.map_instrument.centerOnPlane();
    }

    // Zoom map in (i.e. zoom index -= 1)
    zoom_in() {
        NAVMAP.zoom_in()
        // this.map_instrument.zoomIn();
        // this.display_zoom();
    }

    // Zoom map out (i.e. zoom index += 1)
    zoom_out() {
        NAVMAP.zoom_out()
        // this.map_instrument.zoomOut();
        // this.display_zoom();
    }

    // Set current zoom index
    set_zoom(i) {
        NAVMAP.map_zoom = i;
        // this.map_instrument.setZoom(i);
    }

    // Return current zoom index
    get_zoom() {
        // return this.map_instrument.getZoom();
        return NAVMAP.map_zoom;
    }


    // ***************************************************************************
    // **************** Settings Page                             ****************
    // ***************************************************************************

    init_settings() {
        if (this.init_settings_completed==null) {

            this.settings_page_el = document.getElementById("lx_9050_settings_page");
            this.settings_page_displayed = false;

            this.settings = [   // Altitude Units
                                [ { "el": document.getElementById("lx_9050_altitude_units_meters"),
                                  "store_name": "B21_ALTITUDE_UNITS",
                                  "var_name": "altitude_units",
                                  "value": "m"
                                },
                                { "el": document.getElementById("lx_9050_altitude_units_feet"),
                                  "store_name": "B21_ALTITUDE_UNITS",
                                  "var_name": "altitude_units",
                                  "value": "feet"
                                }
                              ],
                              // Speed Units
                              [ { "el": document.getElementById("lx_9050_speed_units_kph"),
                                  "store_name": "B21_SPEED_UNITS",
                                  "var_name": "speed_units",
                                  "value": "kph"
                                },
                                { "el": document.getElementById("lx_9050_speed_units_knots"),
                                  "store_name": "B21_SPEED_UNITS",
                                  "var_name": "speed_units",
                                  "value": "knots"
                                }
                              ],
                              // Distance Units
                              [ { "el": document.getElementById("lx_9050_distance_units_km"),
                                  "store_name": "B21_DISTANCE_UNITS",
                                  "var_name": "distance_units",
                                  "value": "km"
                                },
                                { "el": document.getElementById("lx_9050_distance_units_miles"),
                                  "store_name": "B21_DISTANCE_UNITS",
                                  "var_name": "distance_units",
                                  "value": "miles"
                                }
                              ],
                              // Climb Units
                              [ { "el": document.getElementById("lx_9050_climb_units_ms"),
                                  "store_name": "B21_CLIMB_UNITS",
                                  "var_name": "climb_units",
                                  "value": "ms"
                                },
                                { "el": document.getElementById("lx_9050_climb_units_knots"),
                                  "store_name": "B21_CLIMB_UNITS",
                                  "var_name": "climb_units",
                                  "value": "knots"
                                }
                              ],
                              // Arrival Height Basis msl/agl
                              [ { "el": document.getElementById("lx_9050_arrival_height_msl"),
                                  "store_name": "B21_ARRIVAL_HEIGHT_BASIS",
                                  "var_name": "arrival_height_basis",
                                  "value": "msl"
                                },
                                { "el": document.getElementById("lx_9050_arrival_height_agl"),
                                  "store_name": "B21_ARRIVAL_HEIGHT_BASIS",
                                  "var_name": "arrival_height_basis",
                                  "value": "agl"
                                }
                              ],
                              // Nav boxes 4/8 (for current waypoint)
                              [ { "el": document.getElementById("lx_9050_nav_boxes_4"),
                                  "store_name": "LX_9050_NAV_BOXES",
                                  "var_name": "nav_boxes",
                                  "value": "4"
                                },
                                { "el": document.getElementById("lx_9050_nav_boxes_8"),
                                  "store_name": "LX_9050_NAV_BOXES",
                                  "var_name": "nav_boxes",
                                  "value": "8"
                                }
                              ],
                              // Reset to defaults
                              [ { "el": document.getElementById("lx_9050_reset_no"),
                                  "store_name": "LX_9050_RESET",
                                  "var_name": "reset",
                                  "value": "no"
                                },
                                { "el": document.getElementById("lx_9050_reset_yes"),
                                  "store_name": "LX_9050_RESET",
                                  "var_name": "reset",
                                  "value": "yes"
                                }
                              ]
                          ];

            this.init_settings_completed=true;
        }
    }

    update_settings() {
        this.init_settings();

        this.ex=70;
        if (this.reset == "yes") {
            this.reset_settings();
            return;
        }

        this.ex=71;
        // Detect if this or another gauge has changed settings
        let current_change = SimVar.GetSimVarValue("Z:B21_SETTING_CHANGE","number");
        if (this.prev_setting_change==null || this.prev_setting_change != current_change) {
            this.prev_setting_change = current_change;
            this.ex=72;
            this.load_settings();
            this.ex=73;
            this.gauge_init();
        }

    }

    get_setting(var_name, store_name, default_value) {
        console.log("get_setting()", var_name, store_name, default_value);
        let store_value;
        try {
            store_value = GetStoredData(store_name);
        } catch(e) {
            this.debug_log("Ex.C.20");
            console.log("get_setting() error",store_name);
        }
        if (store_value) {
            if (typeof default_value === 'string' || default_value instanceof String) {
                this[var_name] = store_value;
                if (this[var_name]==null || this[var_name]=="") {
                    console.log("get_setting() ERROR, empty value for",var_name);
                    this[var_name] = default_value;
                }
            } else if (default_value instanceof Array) { // list of permitted strings
                this[var_name] = store_value;
                if (this[var_name]==null || this[var_name]=="") {
                    console.log("get_setting() ERROR, empty value for",var_name);
                    this[var_name] = default_value[0];
                } else if (!default_value.includes(this[var_name])) { // string not on list
                    console.log("get_setting() ERROR, unacceptable value for",var_name, this[var_name]);
                    this[var_name] = default_value[0];
                }
            } else if (Number.isInteger(default_value)) {
                this[var_name] = parseInt(store_value);
                if (this[var_name]==null | isNaN(this[var_name])) { // parseInt can return NaN
                    console.log("get_setting() ERROR, null/NaN value for",var_name);
                    this[var_name] = default_value;
                }
            } else {
                this[var_name] = parseFloat(store_value);
                if (this[var_name]==null | isNaN(this[var_name])) {
                    console.log("get_setting() ERROR, null/NaN value for",var_name);
                    this[var_name] = default_value;
                }
            }
        } else {
            this[var_name] = default_value;
        }
        console.log("get_setting() this.["+var_name+"]=",this[var_name]);
    }

    set_setting(var_name, store_name, value) {
        console.log("set_setting",var_name,store_name, value);
        this[var_name] = value;
        SetStoredData(store_name, ""+value); // value is coerced to string
        // toggle SimVar 0/1 to tell other gauges that settings have changed
        let settings_toggle = SimVar.GetSimVarValue("Z:B21_SETTING_CHANGE","number");
        // This simvar change will signal other gauges and trigger update_settings() in this gauge.
        SimVar.SetSimVarValue("Z:B21_SETTING_CHANGE","number", settings_toggle == 0 ? 1 : 0);
    }

    // Load settings from LocalStorage
    // Note reset_settings() is complimentary to this, with each get_setting() replaced with set_setting()
    // so if this procedure is updated, rebuild reset_settings() below.
    load_settings() {
        // Load B21_ALTITUDE_UNITS from dataStore ("m" | "feet")
        this.get_setting("altitude_units", "B21_ALTITUDE_UNITS", ["m","feet"]); // first value is default

        // Load B21_SPEED_UNITS from dataStore ("kph" | "knots")
        this.get_setting("speed_units", "B21_SPEED_UNITS", ["kph","knots"]);

        // Load B21_DISTANCE_UNITS from dataStore ("km" | "miles")
        this.get_setting("distance_units", "B21_DISTANCE_UNITS", ["km","miles"]);

        // Load B21_CLIMB_UNITS from dataStore ("ms" | "knots")
        this.get_setting("climb_units", "B21_CLIMB_UNITS", ["ms","knots"]);

        // Load LX_9050_ARRIVAL_HEIGHT_BASIS from dataStore ("agl" | "msl")
        this.get_setting("arrival_height_basis", "B21_ARRIVAL_HEIGHT_BASIS", ["msl","agl"]);

        // Load LX_9050_NAV_DISPLAY_MODE from dataStore ("0".."<max>")
        this.get_setting("nav_display_mode", "LX_9050_NAV_DISPLAY_MODE", 0);

        // Load LX_9050_NAV_WP_BOXES from dataStore ("4" | "8")
        this.get_setting("nav_boxes", "LX_9050_NAV_BOXES", "8");

        // Load B21_TASK_SPEED_UNITS from dataStore ("kph" | "mph" | "knots")
        //DEBUG we have no user setting option for task_speed_units, so this currently will set to default
        this.get_setting("task_speed_units", "B21_TASK_SPEED_UNITS", this.distance_units=="km" ? "kph" : this.speed_units);

        // SPECIAL CASE: reset all settings to defaults always initializes to "no"
        this.reset = "no"; // "no" | "yes"

        this.log_settings();
    }

    log_settings() {
        console.log("log_settings() this.altitude_units",this.altitude_units, "B21_ALTITUDE_UNITS", "m");
        console.log("log_settings() this.speed_units",this.speed_units, "B21_SPEED_UNITS", "kph");
        console.log("log_settings() this.distance_units",this.distance_units, "B21_DISTANCE_UNITS", "km");
        console.log("log_settings() this.climb_units",this.climb_units, "B21_CLIMB_UNITS", "ms");
        console.log("log_settings() this.arrival_height_basi",this.arrival_height_basis, "B21_ARRIVAL_HEIGHT_BASIS", "msl");
        console.log("log_settings() this.nav_display_mode",this.nav_display_mode, "LX_9050_NAV_DISPLAY_MODE", 0);
        console.log("log_settings() this.nav_boxes",this.nav_boxes, "LX_9050_NAV_BOXES", "8");
        console.log("log_settings() this.task_speed_units",this.task_speed_units, "B21_TASK_SPEED_UNITS", this.distance_units=="km" ? "kph" : this.speed_units);
    }

    reset_settings() {
        // Load B21_ALTITUDE_UNITS from dataStore ("m" | "feet")
        this.set_setting("altitude_units", "B21_ALTITUDE_UNITS", "m");

        // Load B21_SPEED_UNITS from dataStore ("kph" | "knots")
        this.set_setting("speed_units", "B21_SPEED_UNITS", "kph");

        // Load B21_DISTANCE_UNITS from dataStore ("km" | "miles")
        this.set_setting("distance_units", "B21_DISTANCE_UNITS", "km");

        // Load B21_CLIMB_UNITS from dataStore ("ms" | "knots")
        this.set_setting("climb_units", "B21_CLIMB_UNITS", "ms");

        // Load LX_9050_ARRIVAL_HEIGHT_BASIS from dataStore ("agl" | "msl")
        this.set_setting("arrival_height_basis", "B21_ARRIVAL_HEIGHT_BASIS", "msl");

        // Load LX_9050_NAV_DISPLAY_MODE from dataStore ("0".."<max>")
        this.set_setting("nav_display_mode", "LX_9050_NAV_DISPLAY_MODE", 0);

        // Load LX_9050_NAV_WP_BOXES from dataStore ("4" | "8")
        this.set_setting("nav_boxes", "LX_9050_NAV_BOXES", "8");

        // Load B21_TASK_SPEED_UNITS from dataStore ("kph" | "mph" | "knots")
        //DEBUG we have no user setting option for task_speed_units, so this currently will set to default
        this.set_setting("task_speed_units", "B21_TASK_SPEED_UNITS", this.distance_units=="km" ? "kph" : this.speed_units);

        // Special setting, "yes" used to trigger reset of settings to defaults
        this.set_setting("reset", "LX_9050_RESET", "no");
    }

    toggle_settings_page() {
        if (this.settings_page_displayed) {
            this.close_settings_page();
        } else {
            this.open_settings_page();
        }
    }

    close_settings_page() {
        this.settings_page_el.style.display = "none";
        this.settings[this.settings_index][this.settings_option_index].el.classList.remove("lx_9050_setting_option_current");
        this.settings_page_displayed = false;
    }

    open_settings_page() {
        this.settings_page_el.style.display = "block";
        this.settings_page_displayed = true;
        this.settings_index = 0;
        this.settings_option_index = 0;

        // Iterate through ALL options and highlight selected values
        for (let i=0; i<this.settings.length; i++) {
            for (let j=0; j<this.settings[i].length; j++) {
                if (this[this.settings[i][j].var_name] == this.settings[i][j].value) {
                    this.settings[i][j].el.classList.add("lx_9050_setting_option_selected");
                } else {
                    this.settings[i][j].el.classList.remove("lx_9050_setting_option_selected");
                }
            }
        }

        // Highlight the first option as current
        this.settings[0][0].el.classList.add("lx_9050_setting_option_current");
    }


    settings_scroll(delta) {
        this.settings[this.settings_index][this.settings_option_index].el.classList.remove("lx_9050_setting_option_current");
        if (delta > 0) {
            this.settings_option_index -= 1;
            if (this.settings_option_index < 0) {
                this.settings_index -= 1;
                if (this.settings_index < 0) {
                    this.settings_index = this.settings.length - 1;
                }
                this.settings_option_index = this.settings[this.settings_index].length - 1;
            }
        } else {
            this.settings_option_index += 1;
            if (this.settings_option_index >= this.settings[this.settings_index].length) {
                this.settings_index += 1;
                if (this.settings_index >= this.settings.length) {
                    this.settings_index = 0;
                }
                this.settings_option_index = 0;
            }
        }
        this.settings[this.settings_index][this.settings_option_index].el.classList.add("lx_9050_setting_option_current");
    }

    settings_select() {
        for (let i=0;i<this.settings[this.settings_index].length;i++) {
            this.settings[this.settings_index][i].el.classList.remove("lx_9050_setting_option_selected");
        }
        let current_option = this.settings[this.settings_index][this.settings_option_index];
        current_option.el.classList.add("lx_9050_setting_option_selected");

        this.set_setting(current_option.var_name, current_option.store_name, current_option.value);
    }

    // **************************************************************************
    // **************** Handling button/knob changes from panel   ***************
    // **************************************************************************

    // Update Thermalling/AI display due to button 1 status change "off", "thermalling", "ai"
    update_button_1_status(new_status) {
        if (new_status=="off" && this.button_1_status!=null) {
            if (this.button_1_status=="thermalling") {
                this.thermalling_display.hide();
            } else if (this.button_1_status=="ai") {
                this.ai_hide();
            }
            this.dropdown_px = 0; // We will adjust center of map if AI is enabled/disabled
        } else if (new_status=="ai") {
                if (this.button_1_status=="thermalling") {
                    this.thermalling_display.hide();
                }
                this.ai_show();
                this.dropdown_px = 572; // We will adjust center of map if AI is enabled/disabled
        } else if (new_status=="thermalling") {
                if (this.button_1_status=="ai") {
                    this.ai_hide();
                }
                this.thermalling_display.show();
                this.dropdown_px = 572; // We will adjust center of map if AI is enabled/disabled
        }
        this.button_1_status = new_status;
    }

    init_interaction() {
        if (this.init_interaction_completed == null) {

            this.prev_button_1_var = this.BUTTON_1_VAR;
            this.prev_button_3_var = this.BUTTON_3_VAR;
            this.prev_button_4_var = this.BUTTON_4_VAR;
            this.prev_button_6_var = this.BUTTON_6_VAR;

            this.prev_knobs_var = this.KNOBS_VAR; // Note we are using the transponder 4-digit code to encode knob changes

            this.init_interaction_completed = true;
        }
    }

    // Given a,b as digit 0..7, return -1, 0, +1 for delta of a -> b, modulo 7
    knob_delta(a,b) {
        //console.log("knob_delta a:"+a+" b:"+b);
        let delta = parseInt(b) - parseInt(a);
        if (delta == 0) {
            return delta;
        }
        return (delta < -4) || (delta > 0 && delta < 4) ? 1 : -1;
    }

    update_interaction() {

        this.init_interaction();

        // HORIZON/THERMALLING button
        this.ex="B.1";
        let toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_1_TOGGLE","bool") ? true : false;
        if (this.prev_button_1_toggle == null) {
            this.prev_button_1_toggle = toggle;
        }
        if (this.prev_button_1_toggle != toggle || this.prev_button_1_var != this.BUTTON_1_VAR) {
            this.prev_button_1_toggle = toggle;
            this.prev_button_1_var = this.BUTTON_1_VAR;

            if (this.button_1_status==null || this.button_1_status=="off") {
                this.update_button_1_status("thermalling");
            } else if (this.button_1_status=="thermalling") {
                this.update_button_1_status("ai");
            } else if (this.button_1_status=="ai") {
                this.update_button_1_status("off");
            }

        }

        // SCROLL MAP NORTH button
        this.ex="B.2";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_2_TOGGLE","bool") ? true : false;
        if (this.prev_button_2_toggle == null) {
            this.prev_button_2_toggle = toggle;
        }
        if (this.prev_button_2_toggle != toggle) {
            this.prev_button_2_toggle = toggle;
            // SCROLL NORTH
            NAVMAP.scroll_map(0,-500);
        }

        // CENTER PLANE button
        this.ex="B.3";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_3_TOGGLE","bool") ? true : false;
        if (this.prev_button_3_toggle == null) {
            this.prev_button_3_toggle = toggle;
        }
        if (this.prev_button_3_toggle != toggle || this.prev_button_3_var != this.BUTTON_3_VAR) {
            this.prev_button_3_toggle = toggle;
            this.prev_button_3_var = this.BUTTON_3_VAR;
            // SET MAP TO AUTO-CENTER PLANE
            this.debug_log_clear();
            NAVMAP.follow_plane();
        }

        // TASK button
        this.ex="B.4";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_4_TOGGLE","bool") ? true : false;
        if (this.prev_button_4_toggle == null) {
            this.prev_button_4_toggle = toggle;
        }
        if (this.prev_button_4_toggle != toggle || this.prev_button_4_var != this.BUTTON_4_VAR) {
            this.prev_button_4_toggle = toggle;
            this.prev_button_4_var = this.BUTTON_4_VAR;
            //this.toggle_task_page();
            this.task_page_toggle();
        }

        // MAP SCROLL SOUTH button
        this.ex="B.5";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_5_TOGGLE","bool") ? true : false;
        if (this.prev_button_5_toggle == null) {
            this.prev_button_5_toggle = toggle;
        }
        if (this.prev_button_5_toggle != toggle) {
            this.prev_button_5_toggle = toggle;
            // SCROLL SOUTH
            NAVMAP.scroll_map(0,500);
        }

        // SETTINGS button
        this.ex="B.6";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_6_TOGGLE","bool") ? true : false;
        if (this.prev_button_6_toggle == null) {
            this.prev_button_6_toggle = toggle;
        }
        if (this.prev_button_6_toggle != toggle || this.prev_button_6_var != this.BUTTON_6_VAR) {
            this.prev_button_6_toggle = toggle;
            this.prev_button_6_var = this.BUTTON_6_VAR;
            this.toggle_settings_page();
        }

        // SCROLL MAP WEST button
        this.ex="B.7";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_7_TOGGLE","bool") ? true : false;
        if (this.prev_button_7_toggle == null) {
            this.prev_button_7_toggle = toggle;
        }
        if (this.prev_button_7_toggle != toggle) {
            this.prev_button_7_toggle = toggle;
            // SCROLL WEST
            NAVMAP.scroll_map(250,0);
        }

        // SCROLL MAP EAST button
        this.ex="B.8";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_BUTTON_8_TOGGLE","bool") ? true : false;
        if (this.prev_button_8_toggle == null) {
            this.prev_button_8_toggle = toggle;
        }
        if (this.prev_button_8_toggle != toggle) {
            this.prev_button_8_toggle = toggle;
            // SCROLL EAST
            NAVMAP.scroll_map(-250,0);
        }

        // *************
        // Rotary Knobs
        // *************

        // Dial 1 = NORTH UP / TRACK UP
        this.ex="D.1";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_1_UP_TOGGLE","bool") ? true : false;
        if (this.prev_dial_1_up_toggle == null) {
            this.prev_dial_1_up_toggle = toggle;
        }
        if (this.prev_dial_1_up_toggle != toggle || this.knob_delta(this.prev_knobs_var[3], this.KNOBS_VAR[3]) == 1) {
            this.prev_dial_1_up_toggle = toggle;
            this.prev_knobs_var = this.KNOBS_VAR;
            this.ex="D.1.2";
            console.log("Setting NorthUp from dial toggle");
            // this.set_map_rotation(EMapRotationMode.NorthUp);
            if(NAVMAP.map_rotation == "trackup") {
                NAVMAP.set_map_rotation("northup");
            } else {
                NAVMAP.set_map_rotation("trackup");
            }
        }

        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_1_DOWN_TOGGLE","bool") ? true : false;
        if (this.prev_dial_1_down_toggle == null) {
            this.prev_dial_1_down_toggle = toggle;
        }
        if (this.prev_dial_1_down_toggle != toggle || this.knob_delta(this.prev_knobs_var[3], this.KNOBS_VAR[3]) == -1) {
            this.prev_dial_1_down_toggle = toggle;
            this.prev_knobs_var = this.KNOBS_VAR;

            this.ex="D.1.3";
            console.log("Setting TrackUp from dial toggle");
            // this.set_map_rotation(EMapRotationMode.TrackUp);
            if(NAVMAP.map_rotation == "trackup") {
                NAVMAP.set_map_rotation("northup");
            } else {
                NAVMAP.set_map_rotation("trackup");
            }
        }

        this.ex="D.1.3";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_1_CLICK","bool") ? true : false;
        if (this.prev_dial_1_click == null) {
            this.prev_dial_1_click = toggle;    // initialize the 'previous' value but do nothing.
        }
        if (this.prev_dial_1_click != toggle) {
            this.prev_dial_1_click = toggle;
            this.ex="D.1.4";
            console.log("Setting NorthUp from dial click");
            // this.set_map_rotation(EMapRotationMode.NorthUp);
            NAVMAP.set_map_rotation("northup");
        }

        // *************
        // Dial 2 = ZOOM
        this.ex="D.2";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_2_UP_TOGGLE","bool") ? true : false;
        if (this.prev_dial_2_up_toggle == null) {
            this.prev_dial_2_up_toggle = toggle;
        }
        if (this.prev_dial_2_up_toggle != toggle || this.knob_delta(this.prev_knobs_var[2], this.KNOBS_VAR[2]) == 1) {
            this.prev_dial_2_up_toggle = toggle;
            this.prev_knobs_var = this.KNOBS_VAR;
            // ZOOM IN
            // this.zoom_in();
            NAVMAP.zoom_in();
        }

        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_2_DOWN_TOGGLE","bool") ? true : false;
        if (this.prev_dial_2_down_toggle == null) {
            this.prev_dial_2_down_toggle = toggle;
        }
        if (this.prev_dial_2_down_toggle != toggle || this.knob_delta(this.prev_knobs_var[2], this.KNOBS_VAR[2]) == -1) {
            this.prev_dial_2_down_toggle = toggle;
            this.prev_knobs_var = this.KNOBS_VAR;
            // ZOOM OUT
            // this.zoom_out();
            NAVMAP.zoom_out();
        }

        // Dial 3 = NAV DISPLAY
        this.ex="D.3";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_3_UP_TOGGLE","bool") ? true : false;
        if (this.prev_dial_3_up_toggle == null) {
            this.prev_dial_3_up_toggle = toggle;
        }
        if (this.prev_dial_3_up_toggle != toggle || this.knob_delta(this.prev_knobs_var[1], this.KNOBS_VAR[1]) == 1) {
            this.prev_dial_3_up_toggle = toggle;
            this.prev_knobs_var = this.KNOBS_VAR;
            // Nav data display +1 waypoint (i.e. scroll nav data wp info UP one extra entry)
            this.nav_display_refresh(1);
        }

        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_3_DOWN_TOGGLE","bool") ? true : false;
        if (this.prev_dial_3_down_toggle == null) {
            this.prev_dial_3_down_toggle = toggle;
        }
        if (this.prev_dial_3_down_toggle != toggle || this.knob_delta(this.prev_knobs_var[1], this.KNOBS_VAR[1]) == -1) {
            this.prev_dial_3_down_toggle = toggle;
            // Nav data display -1 waypoint (i.e. scroll nav data wp info DOWN one less entry)
            this.prev_knobs_var = this.KNOBS_VAR;
            this.nav_display_refresh(-1);
        }

        this.ex="D.3.1";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_3_CLICK","bool") ? true : false;
        if (this.prev_dial_3_click == null) {
            this.prev_dial_3_click = toggle;    // initialize the 'previous' value but do nothing.
        }
        if (this.prev_dial_3_click != toggle) {
            this.prev_dial_3_click = toggle;
            // Tell the Nav Panel you want to start the task from here
            //this.task_start();
        }

        this.ex="D.4";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_4_UP_TOGGLE","bool") ? true : false;
        if (this.prev_dial_4_up_toggle == null) {
            this.prev_dial_4_up_toggle = toggle;
        }
        if (this.prev_dial_4_up_toggle != toggle || this.knob_delta(this.prev_knobs_var[0], this.KNOBS_VAR[0]) == 1) {
            this.prev_dial_4_up_toggle = toggle;
            this.prev_knobs_var = this.KNOBS_VAR;
            // Scroll either through the settings or waypoints
            if (this.settings_page_displayed) {
                this.settings_scroll(1);
            } else {
                // PREVIOUS WAYPOINT
                this.change_waypoint(-1);
            }
        }

        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_4_DOWN_TOGGLE","bool") ? true : false;
        if (this.prev_dial_4_down_toggle == null) {
            this.prev_dial_4_down_toggle = toggle;
        }
        if (this.prev_dial_4_down_toggle != toggle || this.knob_delta(this.prev_knobs_var[0], this.KNOBS_VAR[0]) == -1) {
            this.prev_dial_4_down_toggle = toggle;
            this.prev_knobs_var = this.KNOBS_VAR;
            // Scroll either through the settings or waypoints
            if (this.settings_page_displayed) {
                this.settings_scroll(-1);
            } else {
                // NEXT WAYPOINT
                this.change_waypoint(1);
            }
        }

        this.ex="D.4.1";
        toggle = SimVar.GetSimVarValue("Z:B21_LX_9050_DIAL_4_CLICK","bool") ? true : false;
        if (this.prev_dial_4_click == null) {
            this.prev_dial_4_click = toggle;
        }
        if (this.prev_dial_4_click != toggle) {
            this.prev_dial_4_click = toggle;
            if (this.settings_page_displayed) {
                this.settings_select();
            } else if (this.task_page_displayed) {
                // Set the current waypoint as the TASK START/FINISH
                this.task_set_start_finish_wp();
            }
        }


    }

    // ***********************************************************************
    // Debug logging methods

    debug_log(str) {
        if (this.DISABLE_DEBUG_LOG) {
            return;
        }
        let debug_el = document.getElementById("lx_9050_debug");

        let str_el = document.createElement("div");
        str_el.className = "lx_9050_debug_str";
        str_el.innerHTML = str;
        debug_el.appendChild(str_el);
    }

    debug_log_clear() {
        let debug_el = document.getElementById("lx_9050_debug");

        while (debug_el.hasChildNodes()) {
            debug_el.removeChild(debug_el.lastChild);
        }
    }
} // End class LX_9050_class

registerInstrument("lx_9050-element", LX_9050_class);
//# sourceMappingURL=notavailable.js.map
