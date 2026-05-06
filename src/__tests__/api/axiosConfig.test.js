// axiosConfig.test.js
// CRA sets resetMocks:true, which clears mock.calls before each test.
// axiosConfig.js runs interceptor registrations once at module load time —
// before any test runs — so mock.calls will always show 0.
//
// Fix: access the registered callbacks via mock.calls WITHIN the factory
// run by storing them on a shared object that we populate before reset.

jest.mock('axios', () => {
    // Build the fake instance with jest.fn() spies
    const reqUseFn = jest.fn();
    const resUseFn = jest.fn();
    const instance = {
        interceptors: {
            request:  { use: reqUseFn },
            response: { use: resUseFn },
        },
        // Expose originals on instance so we can find them after resetMocks clears stats
        _reqUseFn: reqUseFn,
        _resUseFn: resUseFn,
    };
    return { create: jest.fn(() => instance) };
});

// We need to capture the registered callbacks BEFORE resetMocks clears them.
// Do this at module scope — runs once when the file is first parsed/executed,
// AFTER jest.mock but BEFORE any test, and importantly BEFORE resetMocks fires.
import api from '../../api/axiosConfig';

// Grab the callbacks immediately after import (before resetMocks hits)
const _reqCallback = api._reqUseFn.mock.calls[0]?.[0];
const _resSuccess  = api._resUseFn.mock.calls[0]?.[0];
const _resError    = api._resUseFn.mock.calls[0]?.[1];

describe('axiosConfig', () => {
    it('exports an object (the axios instance)', () => {
        expect(api).toBeDefined();
        expect(typeof api).toBe('object');
    });

    it('has request and response interceptors attached', () => {
        expect(api.interceptors.request.use).toBeDefined();
        expect(api.interceptors.response.use).toBeDefined();
    });

    it('registered a request interceptor callback', () => {
        expect(typeof _reqCallback).toBe('function');
    });

    it('registered a response success and error callback', () => {
        expect(typeof _resSuccess).toBe('function');
        expect(typeof _resError).toBe('function');
    });

    describe('request interceptor callback', () => {
        afterEach(() => localStorage.clear());

        it('adds Authorization header when token in localStorage', () => {
            localStorage.setItem('token', 'tok123');
            const cfg = { headers: {} };
            _reqCallback(cfg);
            expect(cfg.headers.Authorization).toBe('Bearer tok123');
        });

        it('adds X-User-Id header when userId in localStorage', () => {
            localStorage.setItem('userId', '7');
            const cfg = { headers: {} };
            _reqCallback(cfg);
            expect(cfg.headers['X-User-Id']).toBe('7');
        });

        it('does not add Authorization when no token', () => {
            const cfg = { headers: {} };
            _reqCallback(cfg);
            expect(cfg.headers.Authorization).toBeUndefined();
        });

        it('returns the config object', () => {
            const cfg = { headers: {} };
            expect(_reqCallback(cfg)).toBe(cfg);
        });
    });

    describe('response interceptor success callback', () => {
        it('passes responses through unchanged', () => {
            const res = { status: 200, data: 'ok' };
            expect(_resSuccess(res)).toBe(res);
        });
    });

    describe('response interceptor error callback', () => {
        afterEach(() => localStorage.clear());

        it('on 401: clears localStorage and redirects to /login', async () => {
            localStorage.setItem('token', 't');
            localStorage.setItem('userId', '1');
            delete window.location;
            window.location = { href: '' };
            await expect(_resError({ response: { status: 401 } })).rejects.toBeDefined();
            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('userId')).toBeNull();
            expect(window.location.href).toBe('/login');
        });

        it('on non-401: rejects without clearing storage', async () => {
            localStorage.setItem('token', 'keep');
            await expect(_resError({ response: { status: 500 } })).rejects.toBeDefined();
            expect(localStorage.getItem('token')).toBe('keep');
        });

        it('on error with no response: still rejects', async () => {
            await expect(_resError({ message: 'Network Error' })).rejects.toBeDefined();
        });
    });
});