import { mergeResolvers } from '@graphql-tools/merge';
import { userResolvers } from './userResolvers';
import { transactionResolvers } from './transactionResolvers';
import { goalResolvers } from './goalResolvers';
import { reportResolvers } from './reportResolvers';
import { GraphQLScalarType, Kind } from 'graphql';
import { GraphQLError } from 'graphql';

// Custom scalar types
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value).toISOString();
    }
    throw new GraphQLError(`Value is not a valid Date: ${value}`);
  },
  parseValue(value: any) {
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Value is not a valid Date: ${value}`);
      }
      return date;
    }
    throw new GraphQLError(`Value is not a valid Date: ${value}`);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError(`Value is not a valid Date: ${ast.value}`);
      }
      return date;
    }
    throw new GraphQLError(`Can only parse strings and integers to dates but got a: ${ast.kind}`);
  },
});

const EmailAddressScalar = new GraphQLScalarType({
  name: 'EmailAddress',
  description: 'Email address scalar type',
  serialize(value: any) {
    if (typeof value !== 'string') {
      throw new GraphQLError(`Value is not a string: ${value}`);
    }
    if (!isValidEmail(value)) {
      throw new GraphQLError(`Value is not a valid email address: ${value}`);
    }
    return value;
  },
  parseValue(value: any) {
    if (typeof value !== 'string') {
      throw new GraphQLError(`Value is not a string: ${value}`);
    }
    if (!isValidEmail(value)) {
      throw new GraphQLError(`Value is not a valid email address: ${value}`);
    }
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Can only parse strings to email addresses but got a: ${ast.kind}`);
    }
    if (!isValidEmail(ast.value)) {
      throw new GraphQLError(`Value is not a valid email address: ${ast.value}`);
    }
    return ast.value;
  },
});

const CurrencyScalar = new GraphQLScalarType({
  name: 'Currency',
  description: 'Currency amount scalar type (stored as cents/smallest unit)',
  serialize(value: any) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new GraphQLError(`Value is not a valid currency amount: ${value}`);
      }
      return parsed;
    }
    throw new GraphQLError(`Value is not a valid currency amount: ${value}`);
  },
  parseValue(value: any) {
    if (typeof value === 'number') {
      if (value < 0) {
        throw new GraphQLError(`Currency amount cannot be negative: ${value}`);
      }
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed) || parsed < 0) {
        throw new GraphQLError(`Value is not a valid currency amount: ${value}`);
      }
      return parsed;
    }
    throw new GraphQLError(`Value is not a valid currency amount: ${value}`);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      const value = parseFloat(ast.value);
      if (value < 0) {
        throw new GraphQLError(`Currency amount cannot be negative: ${value}`);
      }
      return value;
    }
    throw new GraphQLError(`Can only parse numbers to currency amounts but got a: ${ast.kind}`);
  },
});

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Scalar resolvers
const scalarResolvers = {
  Date: DateScalar,
  EmailAddress: EmailAddressScalar,
  Currency: CurrencyScalar,
};

// Merge all resolvers
export const resolvers = mergeResolvers([
  scalarResolvers,
  userResolvers,
  transactionResolvers,
  goalResolvers,
  reportResolvers,
]);

export default resolvers;