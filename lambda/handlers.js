/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs
 * */
const SessionEndedRequestHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === "SessionEndedRequest"
	},
	handle(handlerInput) {
		console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`)
		// Any cleanup logic goes here.
		return handlerInput.responseBuilder.getResponse() // notice we send an empty response
	},
}
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents
 * by defining them above, then also adding them to the request handler chain below
 * */
const IntentReflectorHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
	},
	handle(handlerInput) {
		const intentName = Alexa.getIntentName(handlerInput.requestEnvelope)
		const speakOutput = `You just triggered ${intentName}`

		return (
			handlerInput.responseBuilder
				.speak(speakOutput)
				//.reprompt('add a reprompt if you want to keep the session open for the user to respond')
				.getResponse()
		)
	},
}
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below
 * */
const ErrorHandler = {
	canHandle() {
		return true
	},
	handle(handlerInput, error) {
		const speakOutput = `Sorry, I had trouble doing what you asked. Please try again. ${JSON.stringify(error)}`
		console.log(`~~~~ Error handled: ${JSON.stringify(error)}`)

		return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse()
	},
}

module.exports = {
	SessionEndedRequestHandler,
	IntentReflectorHandler,
	ErrorHandler,
}
