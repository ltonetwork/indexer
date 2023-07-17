import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { RequestModuleConfig } from './request.module';
import { RequestService } from './request.service';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';

describe('RequestService', () => {
  let module: TestingModule;
  let requestService: RequestService;
  let httpService: HttpService;

  function spy() {
    const response = { status: 200, data: 'foo' } as AxiosResponse;
    const http = {
      request: jest.spyOn(httpService, 'request').mockImplementation(() => of(response)),
    };

    return { http };
  }

  beforeEach(async () => {
    module = await Test.createTestingModule(RequestModuleConfig).compile();
    await module.init();

    requestService = module.get<RequestService>(RequestService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('get()', () => {
    test('should execute get request', async () => {
      const spies = spy();

      const url = 'http://example.com/foo';
      const response = { status: 200, data: 'foo' };
      expect(await requestService.get(url)).toEqual(response);

      expect(spies.http.request.mock.calls.length).toBe(1);
      expect(spies.http.request.mock.calls[0][0]).toEqual({ method: 'get', url });
    });
  });

  describe('delete()', () => {
    test('should execute delete request', async () => {
      const spies = spy();

      const url = 'http://example.com/foo';
      const response = { status: 200, data: 'foo' };
      expect(await requestService.delete(url)).toEqual(response);

      expect(spies.http.request.mock.calls.length).toBe(1);
      expect(spies.http.request.mock.calls[0][0]).toEqual({ method: 'delete', url });
    });
  });

  describe('head()', () => {
    test('should execute head request', async () => {
      const spies = spy();

      const url = 'http://example.com/foo';
      const response = { status: 200, data: 'foo' };
      expect(await requestService.head(url)).toEqual(response);

      expect(spies.http.request.mock.calls.length).toBe(1);
      expect(spies.http.request.mock.calls[0][0]).toEqual({ method: 'head', url });
    });
  });

  describe('post()', () => {
    test('should execute post request', async () => {
      const spies = spy();

      const url = 'http://example.com/foo';
      const response = { status: 200, data: 'foo' };
      expect(await requestService.post(url)).toEqual(response);

      expect(spies.http.request.mock.calls.length).toBe(1);
      expect(spies.http.request.mock.calls[0][0]).toEqual({ method: 'post', url });
    });
  });

  describe('put()', () => {
    test('should execute put request', async () => {
      const spies = spy();

      const url = 'http://example.com/foo';
      const response = { status: 200, data: 'foo' };
      expect(await requestService.put(url)).toEqual(response);

      expect(spies.http.request.mock.calls.length).toBe(1);
      expect(spies.http.request.mock.calls[0][0]).toEqual({ method: 'put', url });
    });
  });

  describe('patch()', () => {
    test('should execute patch request', async () => {
      const spies = spy();

      const url = 'http://example.com/foo';
      const response = { status: 200, data: 'foo' };
      expect(await requestService.patch(url)).toEqual(response);

      expect(spies.http.request.mock.calls.length).toBe(1);
      expect(spies.http.request.mock.calls[0][0]).toEqual({ method: 'patch', url });
    });
  });
});
