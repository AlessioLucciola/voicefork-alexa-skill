const Alexa = require("ask-sdk-core")

const LaunchRequestHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
	},
	handle(handlerInput) {
		const speakOutput = "Welcome to VoiceFork, tell me the details of the reservation!"
		return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse()
	},
}

const CancelAndStopIntentHandler = {
	canHandle(handlerInput) {
		return (
			Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
			(Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent" || Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent")
		)
	},
	handle(handlerInput) {
		const speakOutput = "Goodbye!"

		return handlerInput.responseBuilder.speak(speakOutput).getResponse()
	},
}

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet
 * */
const FallbackIntentHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.FallbackIntent"
	},
	handle(handlerInput) {
		const speakOutput = "Sorry, I don't know about that. Please try again."

		return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse()
	},
}

const HelpIntentHandler = {
	canHandle(handlerInput) {
		return Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" && Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
	},
	handle(handlerInput) {
		const speakOutput = "You can say hello to me! How can I help?"

		return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse()
	},
}

module.exports = {
	LaunchRequestHandler,
	CancelAndStopIntentHandler,
	FallbackIntentHandler,
	HelpIntentHandler,
}
