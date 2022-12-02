A few modded functions for the Madolo/B21 AS 33:

<h2>Installation:</h2>
Simply drop the included folder "AS33_MadoloB21_1.7.3.J-lxn" into your community folder. No need to change anything in your existing installation. To uninstall delete the folder and you're "back to normal".

------------------------------

Updated:

Fixed a bug that prevented clicks on the glider icon.

Added a switch to toggle the airport/airspaces layer (this layer can be loading slow at times)

Fixed a bug, where the speedtape would overlay the thermalling display

Fixed a bug, where the countdown timer remained visible after a multiplayer-event was left

Added the reference points from kabouter_plons for optimized positions for tow rope and wing runner when using MSFS launch methods.


------------------------------

The map is exchanged for a topographic map based on Google map tiles. Since those tiles are pre-generated, in "track up" mode the labels will also b rotated.

In the top left corner a speedtape gauge shows current speed. This can be toggled on/off by clicking.

Underneath the glider icon in the map center arrows indicate wind direction: purple is current wind, underlying grey arrow shows average wind during the last few minutes. Right of the glider icon a green/red arrow displays the current vertical wind component. All wind arrows can also be toggled on/off by clicking the glider icon.

Clicking the "race flag" icon in the top right corner toggles the multiplayer racing feature, that communicates flight data between gliders on the same task and can display live race standings:

First view asks you to enter a username. As default the aircraft registration is used. You can change that to your pleasing. A good idea would be to use a name short name, as it will later be displayed on other pilots nav map and you don't want to clutter that with a username like "bestpilotinthewholewideworld2338992" ;-) 

Once connected you see a - most likely very short or empty "events" list, showing all available flights. You only see events that use the same task/flightplan you have currently loaded. Click an event to join or click "add new flight" to create your own event and then join it. You need to enter a title and the start time (hour and minutes) in UTC/ZULU time. Obviously only one pilot needs to add a new flight. All others should join his or her event, so that everybody flies in the same event and appears in the same list.

Once other pilots join you'll see the list of participants and also see other pilots position on the nav map.

When a pilot crosses the start line, his/her average speed and flown distance is shown in the list. The list will now be sorted by distance flown, effectively a live ranking of the race. When a pilot crosses the finish line, total task time will be displayed instead of distance flown and used for sorting.

Communication is done via a google cloud service that has a traffic limit, so the feature might not always be available.
