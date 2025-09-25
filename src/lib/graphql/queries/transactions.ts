import { gql } from '@apollo/client';

export const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $filters: TransactionFiltersInput
    $limit: Int = 20
    $offset: Int = 0
    $sortBy: String = "date"
    $sortOrder: String = "DESC"
  ) {
    getTransactions(
      filters: $filters
      limit: $limit
      offset: $offset
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges {
        node {
          id
          description
          amount
          type
          category
          date
          notes
          tags
          status
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
      totalAmount
    }
  }
`;

export const GET_TRANSACTION = gql`
  query GetTransaction($id: ID!) {
    getTransaction(id: $id) {
      id
      description
      amount
      type
      category
      date
      notes
      tags
      status
      createdAt
      updatedAt
    }
  }
`;

export const SEARCH_TRANSACTIONS = gql`
  query SearchTransactions($query: String!, $limit: Int = 10) {
    searchTransactions(query: $query, limit: $limit) {
      id
      description
      amount
      type
      category
      date
      notes
      tags
      status
    }
  }
`;

export const ADD_TRANSACTION = gql`
  mutation AddTransaction($input: TransactionInput!) {
    addTransaction(input: $input) {
      id
      description
      amount
      type
      category
      date
      notes
      tags
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $input: UpdateTransactionInput!) {
    updateTransaction(id: $id, input: $input) {
      id
      description
      amount
      type
      category
      date
      notes
      tags
      status
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($id: ID!) {
    deleteTransaction(id: $id)
  }
`;

export const BULK_DELETE_TRANSACTIONS = gql`
  mutation BulkDeleteTransactions($ids: [ID!]!) {
    bulkDeleteTransactions(ids: $ids)
  }
`;