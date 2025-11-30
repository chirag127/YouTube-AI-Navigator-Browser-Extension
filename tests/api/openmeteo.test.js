import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenMeteoAPI } from '../../extension/api/openmeteo.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
}));

describe('OpenMeteoAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new OpenMeteoAPI();
    });

    describe('getWeather', () => {
        it('should return weather data on success', async () => {
            const mockData = { current_weather: { temperature: 20 } };
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { openmeteo: { enabled: true } } });

            const result = await api.getWeather(10, 20);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.open-meteo.com/v1/forecast?latitude=10&longitude=20&current_weather=true'
            );
            expect(result).toEqual({ temperature: 20 });
        });

        it('should return null when disabled', async () => {
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { openmeteo: { enabled: false } } });

            const result = await api.getWeather(10, 20);

            expect(result).toBeNull();
        });

        it('should return null for invalid coordinates', async () => {
            const result = await api.getWeather(null, 20);

            expect(result).toBeNull();
        });

        it('should return null on no current_weather', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue({}),
            });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { openmeteo: { enabled: true } } });

            const result = await api.getWeather(10, 20);

            expect(result).toBeNull();
        });
    });

    describe('getCoordinates', () => {
        it('should return coordinates on success', async () => {
            const mockData = { results: [{ lat: 10, lon: 20 }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.getCoordinates('city');

            expect(sf).toHaveBeenCalledWith(
                'https://geocoding-api.open-meteo.com/v1/search?name=city&count=1&language=en&format=json'
            );
            expect(result).toEqual({ lat: 10, lon: 20 });
        });

        it('should return null on no results', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue({ results: [] });

            const result = await api.getCoordinates('city');

            expect(result).toBeNull();
        });
    });
});