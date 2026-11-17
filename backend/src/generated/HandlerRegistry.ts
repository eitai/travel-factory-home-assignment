import { registerHandlerRefs } from "commoneventframework";

import * as __cef_modules_auth_authHandlers from "../modules/auth/authHandlers";
import * as __cef_modules_requestHistory_requestHistoryHandlers from "../modules/requestHistory/requestHistoryHandlers";
import * as __cef_modules_teamCalendar_teamCalendarHandlers from "../modules/teamCalendar/teamCalendarHandlers";
import * as __cef_modules_users_userHandlers from "../modules/users/userHandlers";
import * as __cef_modules_vacationRequests_vacationRequestHandlers from "../modules/vacationRequests/vacationRequestHandlers";

export class HandlerRegistry {
	static register(): void {
		registerHandlerRefs({
			"modules/auth/authHandlers#getCurrentUser": __cef_modules_auth_authHandlers.getCurrentUser,
			"modules/auth/authHandlers#login": __cef_modules_auth_authHandlers.login,
			"modules/auth/authHandlers#parseLogin": __cef_modules_auth_authHandlers.parseLogin,
			"modules/requestHistory/requestHistoryHandlers#getHistory": __cef_modules_requestHistory_requestHistoryHandlers.getHistory,
			"modules/requestHistory/requestHistoryHandlers#parseVacationRequestChangedEvent": __cef_modules_requestHistory_requestHistoryHandlers.parseVacationRequestChangedEvent,
			"modules/requestHistory/requestHistoryHandlers#recordVacationRequestChanged": __cef_modules_requestHistory_requestHistoryHandlers.recordVacationRequestChanged,
			"modules/teamCalendar/teamCalendarHandlers#getCalendar": __cef_modules_teamCalendar_teamCalendarHandlers.getCalendar,
			"modules/teamCalendar/teamCalendarHandlers#parseTeamCalendarQuery": __cef_modules_teamCalendar_teamCalendarHandlers.parseTeamCalendarQuery,
			"modules/users/userHandlers#listUsers": __cef_modules_users_userHandlers.listUsers,
			"modules/vacationRequests/vacationRequestHandlers#approve": __cef_modules_vacationRequests_vacationRequestHandlers.approve,
			"modules/vacationRequests/vacationRequestHandlers#cancel": __cef_modules_vacationRequests_vacationRequestHandlers.cancel,
			"modules/vacationRequests/vacationRequestHandlers#listAll": __cef_modules_vacationRequests_vacationRequestHandlers.listAll,
			"modules/vacationRequests/vacationRequestHandlers#listMine": __cef_modules_vacationRequests_vacationRequestHandlers.listMine,
			"modules/vacationRequests/vacationRequestHandlers#parseListAllVacationRequests": __cef_modules_vacationRequests_vacationRequestHandlers.parseListAllVacationRequests,
			"modules/vacationRequests/vacationRequestHandlers#parseListMyVacationRequests": __cef_modules_vacationRequests_vacationRequestHandlers.parseListMyVacationRequests,
			"modules/vacationRequests/vacationRequestHandlers#parseRejectVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.parseRejectVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#parseSubmitVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.parseSubmitVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#parseUpdateVacationRequest": __cef_modules_vacationRequests_vacationRequestHandlers.parseUpdateVacationRequest,
			"modules/vacationRequests/vacationRequestHandlers#parseVacationRequestId": __cef_modules_vacationRequests_vacationRequestHandlers.parseVacationRequestId,
			"modules/vacationRequests/vacationRequestHandlers#reject": __cef_modules_vacationRequests_vacationRequestHandlers.reject,
			"modules/vacationRequests/vacationRequestHandlers#submit": __cef_modules_vacationRequests_vacationRequestHandlers.submit,
			"modules/vacationRequests/vacationRequestHandlers#update": __cef_modules_vacationRequests_vacationRequestHandlers.update,
		});
	}
}

HandlerRegistry.register();
