import { Moment } from 'moment';

export interface RecurringEventInfo {
	type: 'daily' | 'weekly' | 'monthly';
	monthlyDay: string | undefined;
	weeklyDays: string | undefined;
	startDate: Moment;
	endDate: Moment;
}

export class RecurringEvents {
	public static getDayOfWeekChar = (date: Moment) => {
		let dayMap = {
			0: 'u',
			1: 'm',
			2: 't',
			3: 'w',
			4: 'r',
			5: 'f',
			6: 's',
		};
		let dayOfWeek = date.day();

		return dayMap[dayOfWeek];
	}

	public static getWeekDayCount = (date: Moment): number => {
		let dateChar = RecurringEvents.getDayOfWeekChar(date);
		let beginOfMonth = date.clone().startOf('month');
		let endDate = date.clone();
		let iterateDate = beginOfMonth.clone();

		let dayCount = 0;
		while (iterateDate.isBefore(endDate)) {
			if (dateChar === RecurringEvents.getDayOfWeekChar(iterateDate))
				dayCount++;

			iterateDate.add(1, 'days');
		}

		return dayCount;
	}

	public static getMonthlyDayIndicatorString = (eventStart: Moment): string => {
		let weekDayCount = RecurringEvents.getWeekDayCount(eventStart);
		let dayOfWeekChar = RecurringEvents.getDayOfWeekChar(eventStart);

		let countWordMap = {
			1: 'first',
			2: 'second',
			3: 'third',
			4: 'fourth',
			5: 'last',
		};

		let weekDayMap = {
			'm': 'Monday',
			't': 'Tuesday',
			'w': 'Wednesday',
			'r': 'Thursday',
			'f': 'Friday',
			's': 'Saturday',
			'u': 'Sunday',
		};

		return 'every ' + countWordMap[weekDayCount] + ' ' + weekDayMap[dayOfWeekChar];
	}
}