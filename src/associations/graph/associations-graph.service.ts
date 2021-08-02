import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';

import { Graph } from 'redisgraph.js';

@Injectable()
export class AssociationsGraphService {

  private graph: Graph;

  constructor(
    private readonly config: ConfigService,
  ) { }

  // @todo: add logging
  async init(): Promise<void> {
    if (!this.graph) {
      const options = this.config.getRedisGraph();

      this.graph = new Graph('associations', options.host, options.port);
    }
  }

  // @todo: temporary method to test the connection
  async execute(): Promise<void> {
    await this.init();

    await this.graph.query(`CREATE (:person{name:'roi',age:32})`);
    await this.graph.query(`CREATE (:person{name:'amit',age:30})`);
    await this.graph.query(`MATCH (a:person), (b:person) WHERE (a.name = 'roi' AND b.name='amit') CREATE (a)-[:knows]->(b)`);

    let response = await this.graph.query(`MATCH (a:person)-[:knows]->(:person) RETURN a.name, a.age`);

    console.log('response: ', response);
    console.log('==============================================');

    while (response.hasNext()) {
      let record = response.next();

      console.log('record: ', record);
      console.log('==============================================');

      console.log('record.get(a.name): ', record.get('a.name'));
      console.log('==============================================');

      console.log('record.get(a.age): ', record.get('a.age'));
      console.log('==============================================');
    }
  }
}
