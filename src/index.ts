#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Cargar variables de entorno si .env existe
try {
  const { config } = await import('dotenv');
  config();
} catch (error) {
  // dotenv no está disponible o no hay archivo .env, usar variables del sistema
}

// Configuración de WHMCS
interface WHMCSConfig {
  url: string;
  identifier: string;
  secret: string;
  accesskey: string;
}

class WHMCSMCPServer {
  private server: Server;
  private config: WHMCSConfig;

  constructor() {
    this.server = new Server(
      {
        name: "whmcs-server",
        version: "1.0.0",
      },
    );

    // Configurar desde variables de entorno
    this.config = {
      url: process.env.WHMCS_URL || "",
      identifier: process.env.WHMCS_IDENTIFIER || "",
      secret: process.env.WHMCS_SECRET || "",
      accesskey: process.env.WHMCS_ACCESS_KEY || "",
    };

    this.setupHandlers();
  }

  private setupHandlers() {
    // Listar herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_client_details",
            description: "Obtener detalles de un cliente específico",
            inputSchema: {
              type: "object",
              properties: {
                clientid: {
                  type: "string",
                  description: "ID del cliente",
                },
              },
              required: ["clientid"],
            },
          },
          {
            name: "get_clients",
            description: "Obtener lista de clientes",
            inputSchema: {
              type: "object",
              properties: {
                limitstart: {
                  type: "number",
                  description: "Índice de inicio (opcional)",
                },
                limitnum: {
                  type: "number",
                  description: "Número de resultados (opcional)",
                },
                search: {
                  type: "string",
                  description: "Término de búsqueda (opcional)",
                },
              },
            },
          },
          {
            name: "get_invoices",
            description: "Obtener facturas",
            inputSchema: {
              type: "object",
              properties: {
                limitstart: {
                  type: "number",
                  description: "Índice de inicio (opcional)",
                },
                limitnum: {
                  type: "number",
                  description: "Número de resultados (opcional)",
                },
                userid: {
                  type: "string",
                  description: "ID del usuario (opcional)",
                },
                status: {
                  type: "string",
                  description: "Estado de la factura (opcional)",
                },
              },
            },
          },
          {
            name: "get_orders",
            description: "Obtener órdenes",
            inputSchema: {
              type: "object",
              properties: {
                limitstart: {
                  type: "number",
                  description: "Índice de inicio (opcional)",
                },
                limitnum: {
                  type: "number",
                  description: "Número de resultados (opcional)",
                },
                userid: {
                  type: "string",
                  description: "ID del usuario (opcional)",
                },
                status: {
                  type: "string",
                  description: "Estado de la orden (opcional)",
                },
              },
            },
          },
          {
            name: "get_products",
            description: "Obtener productos disponibles",
            inputSchema: {
              type: "object",
              properties: {
                pid: {
                  type: "string",
                  description: "ID del producto específico (opcional)",
                },
                gid: {
                  type: "string",
                  description: "ID del grupo de productos (opcional)",
                },
              },
            },
          },
          {
            name: "get_tickets",
            description: "Obtener tickets de soporte",
            inputSchema: {
              type: "object",
              properties: {
                limitstart: {
                  type: "number",
                  description: "Índice de inicio (opcional)",
                },
                limitnum: {
                  type: "number",
                  description: "Número de resultados (opcional)",
                },
                clientid: {
                  type: "string",
                  description: "ID del cliente (opcional)",
                },
                status: {
                  type: "string",
                  description: "Estado del ticket (opcional)",
                },
              },
            },
          },
        ] as Tool[],
      };
    });

    // Manejar llamadas a herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_client_details":
            return await this.getClientDetails((args as any).clientid);
          case "get_clients":
            return await this.getClients(args);
          case "get_invoices":
            return await this.getInvoices(args);
          case "get_orders":
            return await this.getOrders(args);
          case "get_products":
            return await this.getProducts(args);
          case "get_tickets":
            return await this.getTickets(args);
          default:
            throw new Error(`Herramienta desconocida: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async callWHMCSAPI(action: string, params: any = {}) {
    const postData = {
      action,
      identifier: this.config.identifier,
      secret: this.config.secret,
      accesskey: this.config.accesskey,
      responsetype: "json",
      ...params,
    };

    try {
      const response = await axios.post(
        `${this.config.url}/includes/api.php`,
        new URLSearchParams(postData).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Error en API WHMCS: ${error}`);
    }
  }

  private async getClientDetails(clientid: string) {
    const result = await this.callWHMCSAPI("GetClientsDetails", { clientid });
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getClients(params: any) {
    const result = await this.callWHMCSAPI("GetClients", params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getInvoices(params: any) {
    const result = await this.callWHMCSAPI("GetInvoices", params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getOrders(params: any) {
    const result = await this.callWHMCSAPI("GetOrders", params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getProducts(params: any) {
    const result = await this.callWHMCSAPI("GetProducts", params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getTickets(params: any) {
    const result = await this.callWHMCSAPI("GetTickets", params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Servidor MCP WHMCS iniciado");
  }
}

// Verificar configuración
if (!process.env.WHMCS_URL || !process.env.WHMCS_IDENTIFIER || !process.env.WHMCS_SECRET|| !process.env.WHMCS_ACCESS_KEY) {
  console.error("Error: Variables de entorno requeridas no configuradas");
  console.error("WHMCS_URL, WHMCS_IDENTIFIER, WHMCS_SECRET, WHMCS_ACCESS_KEY son obligatorias");
}

const server = new WHMCSMCPServer();
server.run().catch(console.error);