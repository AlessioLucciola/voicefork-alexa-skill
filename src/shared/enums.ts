export enum RequestTypes {
	Launch = "LaunchRequest",
	Intent = "IntentRequest",
	SessionEnded = "SessionEndedRequest",
	SystemExceptionEncountered = "System.ExceptionEncountered",
}

export enum IntentTypes {
	Help = "AMAZON.HelpIntent",
	Stop = "AMAZON.StopIntent",
	Cancel = "AMAZON.CancelIntent",
	Fallback = "AMAZON.FallbackIntent",
	Date = "AMAZON.DATE",
	LocalBusiness = "AMAZON.LocalBusiness",
	Number = "AMAZON.NUMBER",
	Time = "AMAZON.TIME",
}
