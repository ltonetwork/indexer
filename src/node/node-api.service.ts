import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { ConfigService } from '../common/config/config.service';
import { RequestService } from '../common/request/request.service';

@Injectable()
export class NodeApiService {
  constructor(private readonly request: RequestService, private readonly config: ConfigService) {}

  async getNodeAddresses(): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/wallet/addresses`);
  }

  async getUnconfirmedTransactions(): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/transactions/unconfirmed`);
  }

  async getLastBlock(): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/blocks/last`);
  }

  async getBlock(id: string | number): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/blocks/at/${id}`);
  }

  async getBlocks(from: number, to: number): Promise<AxiosResponse | Error> {
    // note: max range of 100 is supported
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/blocks/seq/${from}/${to}`);
  }

  async getTransaction(id: string): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/transactions/info/${id}`);
  }

  async signTransaction(data: any): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.post(`${url}/transactions/sign`, data, {
      headers: {
        'X-Api-Key': this.config.getNodeApiKey(),
      },
    });
  }

  async broadcastTransaction(data: any): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.post(`${url}/transactions/broadcast`, data, {
      headers: {
        'X-Api-Key': this.config.getNodeApiKey(),
      },
    });
  }

  async signAndBroadcastTransaction(data: any): Promise<AxiosResponse | Error> {
    const signResponse = await this.signTransaction(data);

    if (signResponse instanceof Error) {
      throw signResponse;
    }

    return this.broadcastTransaction(signResponse.data);
  }

  async getSponsorshipStatus(address: string): Promise<AxiosResponse<{ sponsor: string[] }> | Error> {
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/sponsorship/status/${address}`, {
      headers: {
        'X-Api-Key': this.config.getNodeApiKey(),
      },
    });
  }

  async getNodeStatus(): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();

    return this.request.get(`${url}/node/status`);
  }

  async getActivationStatus(): Promise<AxiosResponse | Error> {
    const url = this.config.getNodeUrl();
    return this.request.get(`${url}/activation/status`);
  }
}
