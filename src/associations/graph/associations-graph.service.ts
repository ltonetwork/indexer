import { Graph, ResultSet } from 'redisgraph.js';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../../config/config.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class AssociationsGraphService {

  private graph: Graph;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) { }

  // @todo: tests for this whole file

  async init(): Promise<void> {
    if (!this.graph) {
      this.logger.debug(`associations-graph: connecting to redis-graph`);

      const options = this.config.getRedisGraph();
      this.graph = new Graph('associations', options.host, options.port);
    }
  }

  async saveAssociation(sender: string, party: string): Promise<void> {
    await this.init();

    this.logger.debug(`associations-graph: indexing association: ${sender} and ${party}`);

    const result = await this.graph.query(`MERGE (s:sender {address:'${sender}'} )-[:ASSOCIATION]->(p:party {address:'${party}'} )`);

    console.log('result: ', result);
    console.log('==============================================');

    return;
  }

  async getAssociations(address: string): Promise<{ children: string[], parents: string[] }> {
    await this.init();

    this.logger.debug(`associations-graph: retrieving associations: ${address}`);

    const childrenResultSet = await this.graph.query(`MATCH (s:sender { address: '${address}' })-[:ASSOCIATION]->(p:party) RETURN p.address as child`);
    const children = this.extractGraphData(childrenResultSet, 'child');

    const parentsResultSet = await this.graph.query(`MATCH (s:sender)-[:ASSOCIATION]->(p:party { address: '${address}' }) RETURN s.address as parent`);
    const parents = this.extractGraphData(parentsResultSet, 'parent');

    return {
      children,
      parents
    };
  }

  private extractGraphData(data: ResultSet, attribute: string): any[] {
    const response = [];

    while (data.hasNext()) {
      const record = data.next();
      response.push(record.get(attribute));
    }

    return response;
  }
}
