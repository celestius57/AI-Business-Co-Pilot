import type { PublicHoliday } from '../types';

const API_BASE_URL = 'https://date.nager.at/api/v3';

/**
 * Fetches public holidays for a given year and country code.
 * @param year The year to fetch holidays for.
 * @param countryCode The 2-letter ISO country code.
 * @returns A promise that resolves to an array of PublicHoliday objects.
 */
export const getPublicHolidays = async (year: number, countryCode: string): Promise<PublicHoliday[]> => {
    if (!countryCode) {
        return [];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/PublicHolidays/${year}/${countryCode}`);
        
        if (!response.ok) {
            // Nager API returns 204 for countries with no holidays, which is fine.
            if (response.status === 204) {
                return [];
            }
            throw new Error(`Failed to fetch holidays: ${response.statusText}`);
        }

        const holidays: PublicHoliday[] = await response.json();
        return holidays;
    } catch (error) {
        console.error('Error fetching public holidays:', error);
        // Return an empty array to prevent the app from crashing.
        return [];
    }
};
