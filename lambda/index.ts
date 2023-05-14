import * as Alexa from "ask-sdk-core"
import { SessionEndedRequestHandler, IntentReflectorHandler, ErrorHandler, LaunchRequestHandler, CancelAndStopIntentHandler, FallbackIntentHandler, HelpIntentHandler } from "./handlers"
import { MakeReservationIntentHandler } from "./IntentHandlers/MakeReservationIntent"

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom
 * */
export const handler = Alexa.SkillBuilders.custom()
	.addRequestHandlers(LaunchRequestHandler, MakeReservationIntentHandler, HelpIntentHandler, CancelAndStopIntentHandler, FallbackIntentHandler, SessionEndedRequestHandler, IntentReflectorHandler)
	.addErrorHandlers(ErrorHandler)
	.withApiClient(new Alexa.DefaultApiClient())
	.withCustomUserAgent("sample/hello-world/v1.2")
	.lambda()
