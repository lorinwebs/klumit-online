import { GraphQLClient } from 'graphql-request';
import { shopifyClient } from './shopify';

/**
 * Shopify Customer API - ליצירת לקוחות
 * 
 * משתמש ב-Storefront API עם הרשאה unauthenticated_write_customers
 * אין צורך ב-Admin API token נפרד!
 */

// נשתמש ב-Storefront API client הקיים
export const shopifyAdminClient = shopifyClient;

// Mutation ליצירת לקוח (Storefront API)
export const CREATE_CUSTOMER_MUTATION = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        firstName
        lastName
        email
        phone
        acceptsMarketing
      }
      customerUserErrors {
        field
        message
        code
      }
    }
  }
`;

// Query לחיפוש לקוח לפי טלפון (Storefront API)
// הערה: Storefront API לא תומך בחיפוש לקוחות - נשתמש ב-Admin API או נצטרך לבדוק אחרת
export const FIND_CUSTOMER_BY_PHONE_QUERY = `
  query getCustomers($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
        }
      }
    }
  }
`;

// Query לקבלת לקוח לפי ID (Storefront API)
export const GET_CUSTOMER_QUERY = `
  query getCustomer($id: ID!) {
    customer(id: $id) {
      id
      firstName
      lastName
      email
      phone
      createdAt
    }
  }
`;

