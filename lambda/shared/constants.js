"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONF = exports.LOCALIZATION_ENABLED = exports.TEST_LATLNG = void 0;
// Coordinates to test the localization features
exports.TEST_LATLNG = { latitude: 41.909734, longitude: 12.349999 };
// Change this if you want to enable the localization. Remember that coordinates are constants.
exports.LOCALIZATION_ENABLED = true;
//TODO: Insert here thresholds and weights configuration for taking decisions
/**
 * Configuration file for parameters.
 *
 * - DISTANCE_THRESHOLD [0,1]: The minimum distance that a restaurant has to have from the query in order to be considered;
 * - CONTEXT_SOFT_THRESHOLD [CONTEXT_SOFT_THRESHOLD, +inf]: _NOT USED_
 * - CONTEXT_HARD_THRESHOLD: [0, CONTEXT_SOFT_THRESHOLD]: _NOT USED_
 * - CONTEXT_WEIGHT [0,1]: The weight of the context part for the average between the context distance and the name distance;
 * - NULL_DISTANCE_SCALING_FACTOR [0,1]: The importance that is given to a restaurant with a contextDistance == null. The lower this value, the lower the final score;
 * - VALUE_MAP: The distribution of how the contextDistance has to be normalized. Values in between are linearly interpolated;
 */
exports.CONF = {
    DISTANCE_THRESHOLD: 0.7,
    CONTEXT_SOFT_THRESHOLD: 2,
    CONTEXT_HARD_THRESHOLD: 0.5,
    CONTEXT_WEIGHT: 0.8,
    NULL_DISTANCE_SCALING_FACTOR: 0.5,
    VALUE_MAP: [
        [0, 0],
        [0.1, 0.01],
        [0.2, 0.05],
        [0.3, 0.1],
        [0.5, 0.3],
        [1, 0.4],
        [2, 0.5],
        [3, 0.6],
        [20, 0.8],
        [100, 1],
    ],
    SCORE_THRESHOLDS: {
        high: 0.6,
        medium: 0.4,
        low: 0.1,
    },
};
