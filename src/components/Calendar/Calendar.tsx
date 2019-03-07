import React from 'react';
import cx from 'classnames';

import Button from '../Button';
import * as component from '../component';
import * as dateUtil from '../../utils/date';
import { useChanges } from '../../hooks/changes';

import './Calendar.less';

type CalendarMode = 'year' | 'month' | 'date';

export interface CalendarProps
  extends component.BaseComponent,
    component.NestedComponent {
  /**
   * 默认日期
   */
  defaultValue?: string | number | Date | null;

  /**
   * 当前展示日期
   */
  value?: string | number | Date | null;

  /**
   * 是否禁用今天以前的日期
   * @default false
   */
  disableTodayAgo?: boolean;

  /**
   * 是否高亮今天(当未选中日期时)
   * @default true
   */
  highlightToday?: boolean;

  /**
   * 今天的显示文案
   */
  todayText?: string;

  /**
   * 一周的起始日期，默认星期日。可选值：0~6
   * @default 0
   */
  weekStart?: number;

  /**
   * 是否隐藏周栏
   * @default false
   */
  hideWeekBox?: boolean;

  /**
   * 是否隐藏头部栏
   * @default false
   */
  hideHeader?: boolean;

  /**
   * 格式化头部栏年份
   * @default yyyy年
   */
  formatHeaderYear?: string;

  /**
   * 格式化头部栏月份
   * @default M月
   */
  formatHeaderMonth?: string;

  /**
   * 日历显示模式，可选值：year-年份日历，month-月份日历，date-详细日历
   * @default date
   */
  mode?: CalendarMode;

  /**
   * 自定义禁用日期的函数，返回true则表示该天禁用
   */
  disabledDate?: (date: Date) => boolean;

  /**
   * 自定义日期格式化函数
   */
  dateFormatter?: (date: Date) => string;

  /**
   * 自定义周格式化函数
   */
  weekFormatter?: (value: number) => string;

  /**
   * 自定义月份格式化函数
   */
  monthFormatter?: (month: number) => string;

  /**
   * 自定义年份格式化函数
   */
  yearFormatter?: (year: number) => string;

  /**
   * 选择日期之后的回调函数
   */
  onChange?: (date: Date) => void;

  /**
   * 头部栏点击事件的回调函数
   */
  onHeaderClick?: (e: React.MouseEvent<HTMLElement>) => void;

  /**
   * 页脚点击事件的回调函数
   */
  onFooterClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

interface CalendarHeaderProps {
  year: number;
  month: number;
  visible: boolean;
  formatYear?: string;
  formatMonth?: string;
  mode?: CalendarMode;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

interface CalendarBodyProps extends CalendarProps {
  value: Date | null;
  currentMonth: number;
  currentYear: number;
  onSelect: (date: Date) => void;
}

interface CalendarWeekBoxProps {
  start: number;
  visible: boolean;
  formatter?: (value: number) => string;
}

const defaultProps: Partial<CalendarProps> = {
  disableTodayAgo: false,
  highlightToday: true,
  weekStart: 0,
  hideWeekBox: false,
  hideHeader: false,
  formatHeaderYear: 'yyyy年',
  formatHeaderMonth: 'M月',
  mode: 'date',
};

function Calendar(props: CalendarProps) {
  const { defaultValue, value, mode } = props;

  const today = new Date();
  const valueProp = defaultValue || value;
  const dateProp = valueProp ? dateUtil.getSafeDate(valueProp) : null;
  const yearProp = (dateProp || today).getFullYear();
  const monthProp = (dateProp || today).getMonth();

  const internallyRef = React.useRef(false);
  const [selectedDate, setSelectedDate] = useChanges<Date | null>(
    dateProp,
    internallyRef.current,
    dateUtil.isEqualDate
  );
  const [currentYear, setCurrentYear] = React.useState(yearProp);
  const [currentMonth, setCurrentMonth] = React.useState(monthProp);

  internallyRef.current = false;

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
  };

  const handleMonthChange = (month: number) => {
    if (month < 0) {
      const newYear = currentYear - 1;
      setCurrentYear(newYear);
      setCurrentMonth(11);
    } else if (month > 11) {
      const newYear = currentYear + 1;
      setCurrentYear(newYear);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(month);
    }
  };

  const handleSelectDate = (date: Date) => {
    if (!dateUtil.isEqualDate(date, selectedDate)) {
      internallyRef.current = true;
      setSelectedDate(date);
      if (!dateUtil.isCurrentMonth(date, currentMonth)) {
        setCurrentMonth(date.getMonth());
      }
      if (!dateUtil.isCurrentYear(date, currentYear)) {
        setCurrentYear(date.getFullYear());
      }
      props.onChange && props.onChange(date);
    }
  };

  const prefix = getPrefix();
  const cls = component.getComponentClasses('calendar', props);

  return (
    <div className={cls} style={props.style}>
      <CalendarHeader
        mode={mode}
        year={currentYear}
        month={currentMonth}
        visible={!props.hideHeader}
        formatYear={props.formatHeaderYear}
        formatMonth={props.formatHeaderMonth}
        onYearChange={handleYearChange}
        onMonthChange={handleMonthChange}
        onClick={props.onHeaderClick}
      />
      <div className={prefix + '-body'}>
        <CalendarBody
          {...props}
          value={selectedDate}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onSelect={handleSelectDate}
        />
      </div>
      {props.children && (
        <div className={prefix + '-footer'} onClick={props.onFooterClick}>
          {props.children}
        </div>
      )}
    </div>
  );
}

function CalendarHeader(props: CalendarHeaderProps) {
  if (!props.visible) return null;

  if (props.mode === 'year') {
    return <YearCalendarHeader {...props} />;
  }

  const handlePreviousYear = () => {
    props.onYearChange(props.year - 1);
  };
  const handleNextYear = () => {
    props.onYearChange(props.year + 1);
  };
  const handlePreviousMonth = () => {
    props.onMonthChange(props.month - 1);
  };
  const handleNextMonth = () => {
    props.onMonthChange(props.month + 1);
  };

  const isDateMode = props.mode === 'date';
  const date = new Date(props.year, props.month);

  return (
    <header className={getPrefix() + '-header'} onClick={props.onClick}>
      <Button onClick={handlePreviousYear}>&lt;&lt;</Button>
      {isDateMode && <Button onClick={handlePreviousMonth}>&lt;</Button>}
      <div className="title">
        <span>{dateUtil.formatter(props.formatYear, date)}</span>
        {isDateMode && (
          <span>{dateUtil.formatter(props.formatMonth, date)}</span>
        )}
      </div>
      {isDateMode && <Button onClick={handleNextMonth}>&gt;</Button>}
      <Button onClick={handleNextYear}>&gt;&gt;</Button>
    </header>
  );
}

function YearCalendarHeader(props: CalendarHeaderProps) {
  const decade = getDecade(props.year);
  const handlePreviousDecade = () => {
    props.onYearChange(props.year - 10);
  };
  const handleNextDecade = () => {
    props.onYearChange(props.year + 10);
  };
  return (
    <header className={getPrefix() + '-header'} onClick={props.onClick}>
      <Button onClick={handlePreviousDecade}>&lt;&lt;</Button>
      <div className="title">
        <span>
          {decade[0]}-{decade[1]}
        </span>
      </div>
      <Button onClick={handleNextDecade}>&gt;&gt;</Button>
    </header>
  );
}

function CalendarBody(props: CalendarBodyProps) {
  let body;
  if (props.mode === 'year') {
    body = <YearCalendarBody {...props} />;
  } else if (props.mode === 'month') {
    body = <MonthCalendarBody {...props} />;
  } else {
    body = (
      <>
        <WeekBox
          start={props.weekStart || 0}
          visible={!props.hideWeekBox}
          formatter={props.weekFormatter}
        />
        <DateCalendarBody {...props} />
      </>
    );
  }
  const prefix = getPrefix();
  return (
    <table
      cellSpacing={0}
      cellPadding={0}
      className={cx(prefix + '-table', props.className)}>
      {body}
    </table>
  );
}

function DateCalendarBody(props: CalendarBodyProps) {
  const { currentYear, currentMonth, weekStart = 0 } = props;
  const datesByWeek = getDatesByWeek(currentYear, currentMonth, weekStart);
  const today = new Date();
  const prefix = getPrefix();
  return (
    <tbody className={prefix + '-grid'}>
      {datesByWeek.map((dates, index) => {
        return (
          <DateCalendarRow {...props} dates={dates} today={today} key={index} />
        );
      })}
    </tbody>
  );
}

function DateCalendarRow(
  props: CalendarBodyProps & { dates: Date[]; today: Date }
) {
  const prefix = getPrefix();
  return (
    <tr className={prefix + '-row'}>
      {props.dates.map(date => {
        return <DateCalendarCell {...props} date={date} key={date.getTime()} />;
      })}
    </tr>
  );
}

function DateCalendarCell(
  props: CalendarBodyProps & { date: Date; today: Date }
) {
  const { date, dateFormatter = defaultDateFormatter } = props;
  const isToday = dateUtil.isEqualDate(date, props.today);
  let selected = dateUtil.isEqualDate(date, props.value);
  if (!props.value && props.highlightToday) selected = isToday;
  const disabled = isDisabledDate(
    date,
    props.today,
    props.disableTodayAgo,
    props.disabledDate
  );
  const handleClick = () => props.onSelect(date);
  const prefix = getPrefix();
  return (
    <td className={prefix + '-cell'}>
      <span
        className={cx(prefix + '-date', {
          today: isToday,
          selected,
          disabled,
          prev: dateUtil.isPreviousMonth(date, props.currentMonth),
          next: dateUtil.isNextMonth(date, props.currentMonth),
        })}
        onClick={handleClick}>
        {(isToday && props.todayText) || dateFormatter(date)}
      </span>
    </td>
  );
}

function MonthCalendarBody(props: CalendarBodyProps) {
  const prefix = getPrefix();
  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <tbody className={prefix + '-grid'}>
      {[0, 1, 2, 3].map(row => (
        <tr key={row} className={prefix + '-row'}>
          {[0, 1, 2].map(column => {
            const month = months[row * 3 + column];
            return <MonthCalendarCell {...props} key={month} month={month} />;
          })}
        </tr>
      ))}
    </tbody>
  );
}

function MonthCalendarCell(props: CalendarBodyProps & { month: number }) {
  const { monthFormatter = defaultMonthFormatter } = props;
  const selected = props.month === props.currentMonth;
  const handleClick = () => {
    const date = (props.value || new Date()).getDate();
    props.onSelect(new Date(props.currentYear, props.month, date));
  };
  const prefix = getPrefix();
  return (
    <td className={prefix + '-cell'}>
      <span
        className={cx(prefix + '-month', { selected })}
        onClick={handleClick}>
        {monthFormatter(props.month)}
      </span>
    </td>
  );
}

function YearCalendarBody(props: CalendarBodyProps) {
  const prefix = getPrefix();
  const years = getYearsByDecade(props.currentYear);
  return (
    <tbody className={prefix + '-grid'}>
      {[0, 1, 2, 3].map(row => {
        return (
          <tr key={row} className={prefix + '-row'}>
            {[0, 1, 2].map(column => {
              const year = years[row * 3 + column];
              return (
                <YearCalendarCell
                  {...props}
                  key={year}
                  year={year}
                  isFirst={year === years[0]}
                  isLast={year === years[years.length - 1]}
                />
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}

function YearCalendarCell(
  props: CalendarBodyProps & {
    year: number;
    isFirst: boolean;
    isLast: boolean;
  }
) {
  const { yearFormatter = defaultYearFormatter } = props;
  const selected = props.year === props.currentYear;
  const handleClick = () => {
    const date = (props.value || new Date()).getDate();
    props.onSelect(new Date(props.year, props.currentMonth, date));
  };
  const prefix = getPrefix();
  return (
    <td className={prefix + '-cell'}>
      <span
        className={cx(prefix + '-year', {
          selected,
          prev: props.isFirst,
          next: props.isLast,
        })}
        onClick={handleClick}>
        {yearFormatter(props.year)}
      </span>
    </td>
  );
}

function WeekBox(props: CalendarWeekBoxProps) {
  const { start, visible, formatter = defaultWeekFormatter } = props;
  if (!visible) return null;
  const week = [];
  for (let i = start; i < start + 7; i++) {
    week.push(i < 7 ? i : i - 7);
  }
  const prefix = getPrefix();
  return (
    <thead className={prefix + '-head'}>
      <tr className={prefix + '-row'}>
        {week.map(v => (
          <th key={v}>{formatter(v)}</th>
        ))}
      </tr>
    </thead>
  );
}

function getPrefix() {
  return component.getComponentPrefix('calendar');
}

function getDatesByWeek(year: number, month: number, weekStart: number) {
  const datesByWeek: Date[][] = [];
  const firstDate = dateUtil.getFirstDateOfMonth(year, month);
  const firstDayOfWeek = firstDate.getDay();

  let start = 0;
  const startDelta = firstDayOfWeek - weekStart;
  if (startDelta > 0) start -= startDelta;

  // grid: 6 * 7
  for (let i = start; i < 42 + start; i++) {
    const week = Math.floor((i + startDelta) / 7);
    let dates = datesByWeek[week];
    if (!dates) dates = datesByWeek[week] = [];
    const date = new Date(year, month, i + 1);
    dates.push(date);
  }

  return datesByWeek;
}

function getYearsByDecade(year: number) {
  const years: number[] = [];
  const decade = getDecade(year);
  for (let i = decade[0] - 1; i <= decade[1] + 1; i++) {
    years.push(i);
  }
  return years;
}

function getDecade(year: number) {
  const thisYear = new Date().getFullYear();
  if (year <= thisYear) {
    const diff = thisYear - year + 1;
    const d = Math.floor(diff / 10);
    const end = thisYear - d * 10;
    return [end - 9, end];
  }
  const diff = year - thisYear + 1;
  const d = Math.floor(diff / 10);
  const start = thisYear + d * 10 + 1;
  return [start, start + 9];
}

function isDisabledDate(
  date: Date,
  today: Date,
  disableTodayAgo?: boolean,
  disabledDate?: (date: Date) => boolean
) {
  if (disabledDate && disabledDate(date)) return true;
  if (disableTodayAgo && dateUtil.lessThanDate(date, today)) return true;
  return false;
}

function defaultWeekFormatter(value: number) {
  const localWeek = '日一二三四五六'.split('');
  return localWeek[value];
}

function defaultDateFormatter(date: Date) {
  return '' + date.getDate();
}

function defaultMonthFormatter(month: number) {
  const localMonths = '一 二 三 四 五 六 七 八 九 十 十一 十二'.split(' ');
  return localMonths[month] + '月';
}

function defaultYearFormatter(year: number) {
  return '' + year;
}

Calendar.defaultProps = defaultProps;

export default Calendar;
