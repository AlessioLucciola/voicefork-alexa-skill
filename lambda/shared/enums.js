"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentTypes = exports.RequestTypes = void 0;
var RequestTypes;
(function (RequestTypes) {
    RequestTypes["Launch"] = "LaunchRequest";
    RequestTypes["Intent"] = "IntentRequest";
    RequestTypes["SessionEnded"] = "SessionEndedRequest";
    RequestTypes["SystemExceptionEncountered"] = "System.ExceptionEncountered";
})(RequestTypes = exports.RequestTypes || (exports.RequestTypes = {}));
var IntentTypes;
(function (IntentTypes) {
    IntentTypes["Help"] = "AMAZON.HelpIntent";
    IntentTypes["Stop"] = "AMAZON.StopIntent";
    IntentTypes["Cancel"] = "AMAZON.CancelIntent";
    IntentTypes["Fallback"] = "AMAZON.FallbackIntent";
    IntentTypes["Date"] = "AMAZON.DATE";
    IntentTypes["LocalBusiness"] = "AMAZON.LocalBusiness";
    IntentTypes["Number"] = "AMAZON.NUMBER";
    IntentTypes["Time"] = "AMAZON.TIME";
})(IntentTypes = exports.IntentTypes || (exports.IntentTypes = {}));
