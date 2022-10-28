// *****************************************************************************
// ************    B21_SETTINGS.js          ************************************
//
// This file contains customization information for the B21 soaring instruments
// *****************************************************************************

// LS4

// max weight:  525 Kg
// max ballast: 170 Kg
// Wing area:   10.5 m^2
// Wingloading:
//   33 Kg/m^2 => 346Kg
//   50 Kg/m^2 => 525Kg

// We input polar in km/h : m/s (the gauge will convert this to m/s : m/s)
//

var B21_POLAR_WEIGHT_KG = 400; // weight (Kg) the curves are directly valid for

//   speed/sink [kph, m/s] (sink NEGATIVE)
var B21_POLAR_CURVE = [
                        [ -10, -10],    // glide ratio:
                        [ 60, -3],      //  5.5
                        [ 70, -0.5],    // 38.9
                        [ 72, -0.5],    // 40.0
                        [ 80, -0.47],   // 47.3
                        [ 90, -0.47],   // 53.2
                        [100, -0.51],   // 54.5 e.g. at 100kph, sink is 0.51 m/s
                        [110, -0.56],   // 54.6
                        [130, -0.72],   // 50.2
                        [150, -0.94],   // 44.3
                        [170, -1.24],   // 38.1
                        [190, -1.63],   // 32.4
                        [210, -2.1],    // 27.8
                        [230, -2.6],    // 24.6
                        [250, -3.2],    // 21.7
                        [270, -4.0],    // 18.8
                        [300, -5.5] ];  // 15.2

// Speed to fly [sink m/s (negative), speed kph]
var B21_STF_CURVE = [
                    [-9, 208],
                    [-4, 208],
                    [-3, 204],
                    [-2, 180],
                    [-1, 147],
                    [ 0, 112],
                    [ 1, 90 ],
                    [ 10, 90]
        ];
