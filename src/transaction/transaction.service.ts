import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import TransactionTypes from './const/types.const';

@Injectable()
export class TransactionService {
  constructor(
    private readonly config: ConfigService,
  ) { }

  getAllTypes(): Array<{ id: string, types: number[] }> {
    const types = Object.keys(TransactionTypes).map((k) => TransactionTypes[k]);
    return types;
  }

  getIdentifiers(): string[] {
    const types = this.getAllTypes();
    return types.map((tx) => tx.id);
  }

  getIdentifierByType(type: number): string | null {
    const types = this.getAllTypes();
    const match = types.find((tx) => tx.types.indexOf(type) > -1);
    return match ? match.id : null;
  }

  getIdentifiersByType(type: number): string[] {
    const types = this.getAllTypes();
    const matches = types.filter((tx) => tx.types.indexOf(type) > -1).map((match) => match.id);
    return matches;
  }

  hasIdentifier(identifier): boolean {
    const identifiers = this.getIdentifiers();
    return identifiers.indexOf(identifier) > -1;
  }
}
