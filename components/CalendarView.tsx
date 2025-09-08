import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Employee, Event, EventType, Team, PublicHoliday, Client, Project } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { BellIcon } from './icons/BellIcon';
// FIX: Corrected import path for useAuth
import { useAuth } from '../contexts/AuthContext';
import { getPublicHolidays } from '../services/holidayService';
import { FlagIcon } from './icons/FlagIcon';
import { formatTime } from '../utils';

interface CalendarViewProps {
  events: Event[];
  employees: Employee[];
  teams: Team[];
  clients: Client[];
  projects: Project[];
  onViewEvent: (event: Event) => void;
  onStartCreateEvent: (date: Date) => void;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EventTypeIcon: React.FC<{ type: EventType, className?: string }> = ({ type, className = "w-3 h-3" }) => {
    switch (type) {
        case 'meeting':
            return <UserGroupIcon className={className} />;
        case 'note':
            return <DocumentTextIcon className={className} />;
        case 'reminder':
            return <BellIcon className={className} />;
        default:
            return null;
    }
};

export const CalendarView: React.FC<CalendarViewProps> = ({ events, employees, teams, clients, projects, onViewEvent, onStartCreateEvent }) => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'day'>('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
    const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
    
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    useEffect(() => {
        const fetchHolidays = async () => {
            if (!user?.settings?.country) return;
            setIsLoadingHolidays(true);
            try {
                const year = currentDate.getFullYear();
                const holidays = await getPublicHolidays(year, user.settings.country);
                setPublicHolidays(holidays);
            } catch (error) {
                console.error("Failed to fetch public holidays:", error);
                setPublicHolidays([]);
            } finally {
                setIsLoadingHolidays(false);
            }
        };

        fetchHolidays();
    }, [currentDate, user?.settings?.country]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsMonthYearPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [pickerRef]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        const startingDay = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();

        // Previous month's padding
        for (let i = 0; i < startingDay; i++) {
            grid.push({ date: null, isPadding: true });
        }
        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            grid.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), day), isPadding: false });
        }
        // Next month's padding
        while (grid.length % 7 !== 0) {
            grid.push({ date: null, isPadding: true });
        }
        return grid;
    }, [currentDate, firstDayOfMonth, lastDayOfMonth]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
        if (view === 'day') {
            setView('month');
        }
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setView('day');
    };

    const renderMonthYearPicker = () => {
        const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }));
        const year = currentDate.getFullYear();
        const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);

        return (
            <div ref={pickerRef} className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-700 p-2 shadow-lg z-10 flex gap-2 border border-slate-600" style={{ borderRadius: 'var(--radius-md)' }}>
                <select 
                    value={currentDate.getMonth()} 
                    onChange={e => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1))}
                    className="bg-slate-800 p-1 text-sm cursor-pointer border border-slate-600 focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                >
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select 
                    value={currentDate.getFullYear()} 
                    onChange={e => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1))}
                    className="bg-slate-800 p-1 text-sm cursor-pointer border border-slate-600 focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                    style={{ borderRadius: 'var(--radius-sm)' }}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
        );
    };

    const renderMonthView = () => (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-700"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <div className="relative">
                        <button onClick={() => setIsMonthYearPickerOpen(prev => !prev)} className="text-2xl font-bold w-48 text-center hover:bg-slate-700/50 p-1" style={{ borderRadius: 'var(--radius-md)' }}>
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </button>
                        {isMonthYearPickerOpen && renderMonthYearPicker()}
                    </div>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-700"><ChevronRightIcon className="w-6 h-6"/></button>
                    <button onClick={handleToday} className="px-3 py-1.5 border border-slate-600 text-sm font-semibold hover:bg-slate-700" style={{ borderRadius: 'var(--radius-md)' }}>Today</button>
                </div>
                <button onClick={() => onStartCreateEvent(new Date())} className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-md)' }}>
                    <PlusIcon className="w-5 h-5"/>
                    New Event
                </button>
            </div>
            <div className="grid grid-cols-7 text-center text-sm font-semibold text-slate-400 border-b border-slate-700">
                {daysOfWeek.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 flex-grow -mx-px -my-px">
                {calendarGrid.map((day, index) => {
                    const isToday = day.date && new Date().toDateString() === day.date.toDateString();
                    const dayEvents = day.date ? events.filter(e => new Date(e.start).toDateString() === day.date?.toDateString()) : [];
                    const holiday = day.date ? publicHolidays.find(h => h.date === day.date?.toISOString().split('T')[0]) : null;

                    return (
                        <div 
                            key={index}
                            onClick={() => !day.isPadding && day.date && handleDayClick(day.date)}
                            className={`group border border-slate-700/50 p-2 flex flex-col overflow-hidden ${day.isPadding ? 'bg-slate-800/50' : 'bg-slate-800 hover:bg-slate-700/50 transition-colors cursor-pointer'}`}
                        >
                            {!day.isPadding && day.date && (
                                <>
                                    <div className={`self-start text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-[var(--color-primary)] text-white' : 'group-hover:bg-slate-700'}`}>
                                        {day.date?.getDate()}
                                    </div>
                                    <div className="flex-grow space-y-1 mt-1 overflow-y-auto min-h-0">
                                        {holiday && (
                                            <div title={holiday.name} className="bg-teal-500/20 text-teal-300 text-xs font-semibold p-1 truncate text-center" style={{ borderRadius: 'var(--radius-sm)' }}>
                                                {holiday.localName}
                                            </div>
                                        )}
                                        {dayEvents.map(event => (
                                            <button 
                                                key={event.id} 
                                                onClick={(e) => { e.stopPropagation(); onViewEvent(event); }} 
                                                className={`w-full flex items-center gap-1.5 text-left text-xs font-semibold p-1 ${event.color} text-white truncate hover:ring-2 hover:ring-white/50`}
                                                style={{ borderRadius: 'var(--radius-sm)' }}
                                            >
                                                <EventTypeIcon type={event.type} />
                                                <span className="flex-1 truncate">{event.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onStartCreateEvent(day.date!); }} 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto ml-auto bg-[var(--color-primary)]/50 rounded-full w-6 h-6 flex items-center justify-center text-white hover:bg-[var(--color-primary)]"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );

    const renderDayView = () => {
        const dayEvents = events
            .filter(e => new Date(e.start).toDateString() === selectedDate.toDateString())
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        const holiday = publicHolidays.find(h => h.date === selectedDate.toISOString().split('T')[0]);


        return (
            <>
                <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-4">
                        <button onClick={() => setView('month')} className="p-2 rounded-full hover:bg-slate-700"><ChevronLeftIcon className="w-6 h-6"/></button>
                        <h2 className="text-2xl font-bold text-center">
                            {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                     </div>
                    <button onClick={() => onStartCreateEvent(selectedDate)} className="flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2 font-semibold hover:bg-[var(--color-primary-hover)]" style={{ borderRadius: 'var(--radius-md)' }}>
                        <PlusIcon className="w-5 h-5" />
                        New Event
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                    {holiday && (
                        <div className="bg-teal-500/20 text-teal-200 p-3 flex items-center gap-3" style={{ borderRadius: 'var(--radius-md)' }}>
                            <FlagIcon className="w-6 h-6 text-teal-400" />
                            <div>
                                <h4 className="font-bold">{holiday.localName}</h4>
                                <p className="text-xs text-teal-300">Public Holiday</p>
                            </div>
                        </div>
                    )}
                    {dayEvents.length > 0 ? dayEvents.map(event => (
                        <button key={event.id} onClick={() => onViewEvent(event)} className={`w-full text-left bg-slate-900/70 p-4 cursor-pointer border-l-4 ${event.color.replace('bg-', 'border-')}`} style={{ borderRadius: 'var(--radius-md)' }}>
                            <div className="flex items-center gap-2">
                                <EventTypeIcon type={event.type} className="w-4 h-4 text-slate-300" />
                                <h4 className="font-bold">{event.title}</h4>
                            </div>
                            <p className="text-sm text-slate-400">
                                {formatTime(event.start, user?.settings)} - {formatTime(event.end, user?.settings)}
                            </p>
                            {event.description && <p className="text-sm mt-1 text-slate-300">{event.description}</p>}
                        </button>
                    )) : (
                        !holiday && (
                            <div className="text-center text-slate-500 pt-16 flex flex-col items-center">
                                <CalendarIcon className="w-16 h-16 text-slate-600 mb-4"/>
                                <p>No events scheduled for this day.</p>
                            </div>
                        )
                    )}
                </div>
            </>
        );
    }

    return (
        <div className="bg-slate-800 p-6 flex flex-col h-[80vh]" style={{ borderRadius: 'var(--radius-lg)' }}>
            {view === 'month' ? renderMonthView() : renderDayView()}
        </div>
    );
};