import { Injectable } from '@nestjs/common';
import { Graph, ResultSet } from 'redisgraph.js';

import { ConfigService } from '../../config/config.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class RedisGraphService {

  private client: Graph;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  async init(): Promise<void> {
    if (!this.client) {
      const options = this.config.getRedisGraph();

      this.logger.debug(`redis-graph: connecting to redis-graph`);
      this.client = new Graph('indexer', options.host, options.port);
    }
  }

  async saveAssociation(sender: string, party: string): Promise<void> {
    await this.init();

    this.logger.debug(`redis-graph: indexing association: ${sender} and ${party}`);

    await this.client.query(`MERGE (s:sender {address:'${sender}'} )-[:ASSOCIATION]->(p:party {address:'${party}'} )`);
  }

  async getAssociations(address: string): Promise<{ children: string[], parents: string[] }> {
    await this.init();

    this.logger.debug(`redis-graph: retrieving associations: ${address}`);

    const childrenResult = await this.client.query(`MATCH (s:sender { address: '${address}' })-[:ASSOCIATION]->(p:party) RETURN p.address as address`);
    const parentsResult = await this.client.query(`MATCH (s:sender)-[:ASSOCIATION]->(p:party { address: '${address}' }) RETURN s.address as address`);

    const children = this.extractGraphData(childrenResult, 'address');
    const parents = this.extractGraphData(parentsResult, 'address');

    return {
      children,
      parents
    };
  }

  async removeAssociation(sender: string, party: string): Promise<void> {
    await this.init();

    this.logger.debug(`redis-graph: removing association: ${sender} and ${party}`);

    await this.client.query(`MATCH (s:sender { address: '${sender}'} )-[a:ASSOCIATION]->(p:party { address: '${party}' }) DELETE a`);
    await this.client.query(`MATCH (s:sender { address: '${party}'} )-[a:ASSOCIATION]->() DELETE a`);
  }

  private extractGraphData(data: ResultSet, attribute: string): any[] {
    const response = [];

    while (data?.hasNext()) {
      const record = data.next();
      response.push(record.get(attribute));
    }

    return response;
  }
}
