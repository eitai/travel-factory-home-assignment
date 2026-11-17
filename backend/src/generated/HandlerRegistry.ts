import { registerHandlerRefs } from "commoneventframework";

import * as __cef_modules_auth_authHandlers from "../modules/auth/authHandlers";
import * as __cef_modules_requestHistory_requestHistoryHandlers from "../modules/requestHistory/requestHistoryHandlers";
import * as __cef_modules_teamCalendar_teamCalendarHandlers from "../modules/teamCalendar/teamCalendarHandlers";
import * as __cef_modules_users_userHandlers from "../modules/users/userHandlers";
import * as __cef_modules_vacationRequests_vacationRequestHandlers from "../modules/vacationRequests/vacationRequestHandlers";

export class HandlerRegistry {
	static register(): void {
		registerHandlerRefs({
			"modules/auth/authHandlers#handleGetCurrentUser": __cef_modules_auth_authHandlers.handleGetCurrentUser,
			"modules/auth/authHandlers#handleLogin": __cef_modules_auth_authHandlers.handleLogin,
			"modules/auth/authHandlers#parseLogin": __cef_modules_auth_authHandlers.parseLogin,
			"modules/requestHistory/requestHistoryHandlers#handleGetVacationRequestHistory": __cef_modules_requestHistory_requestHistoryHandlers.handleGetVacationRequestHistory,
			"modules/requestHistory/requestHistoryHandlers#handleVacationRequestChangedEvent": __cef_modules_requestHistory_requestHistoryHandlers.handleVacationRequestChangedEvent,
			"modules/requestHistory/requestHistoryHandlers#parseVacationRequestChangedEvent": __cef_modules_requestHistory_requestHistoryHandlers.parseVacationRequestChangedEvent,
			"modules/teamCalendar/teamCalendarHandlers#handleGetTeamCalendar": __cef_modules_teamCalendar_teamCalendarHandlers.handleGetTeamCalendar,
			"modules/teamCalendar/teamCalendarHandlers#parseTeamCalendarQuery": __cef_modules_teamCalendar_teamCalendarHandlers.parseTeamCalendarQuery,
			"modules/users/userHandlers#handleListUsers": __cef_modules_users_userHandlers.handleListUsers,
			"modules/vacationRequests/vacationRequestHandlers#handleApproveVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.handleApproveVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#handleCancelVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.handleCancelVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#handleListAllVacationRequests": __cef_modules_vacationRequests_vacationRequestHandlers.handleListAllVacationRequests,
			"modules/vacationRequests/vacationRequestHandlers#handleListMyVacationRequests": __cef_modules_vacationRequests_vacationRequestHandlers.handleListMyVacationRequests,
			"modules/vacationRequests/vacationRequestHandlers#handleRejectVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.handleRejectVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#handleSubmitVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.handleSubmitVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#handleUpdateVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.handleUpdateVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#parseListAllVacationRequests": __cef_modules_vacationRequests_vacationRequestHandlers.parseListAllVacationRequests,
			"modules/vacationRequests/vacationRequestHandlers#parseListMyVacationRequests": __cef_modules_vacationRequests_vacationRequestHandlers.parseListMyVacationRequests,
			"modules/vacationRequests/vacationRequestHandlers#parseRejectVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.parseRejectVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#parseSubmitVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.parseSubmitVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#parseUpdateVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.parseUpdateVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#parseVacationRequestId": __cef_modules_vacationRequests_vacationRequestHandlers.parseVacationRequestId,
		});
	}
}

HandlerRegistry.register();
