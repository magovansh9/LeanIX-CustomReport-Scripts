// Production Token : mu22OYatDdgeAGnOAjwSBs8dHt9ytC8dTYZjwRBr
// Sandbox token: qnY8AWkqYJMdzU6nA7LPE5TcbR2D4g3q6LyyCghW
//importing alpine js, a javascript framework, to implement extended functionality such as interlinking html and js efficiently
import "alpinejs";
import "@leanix/reporting";
import "./assets/tailwind.css";
import Excel from "exceljs";
import { saveAs } from "file-saver";

// API token for respective workspace, change token here to switch between workspaces
const API_TOKEN = "qnY8AWkqYJMdzU6nA7LPE5TcbR2D4g3q6LyyCghW";

// Load the data with today's date as default Maximum Date
var today = new Date();
var dd = String(today.getDate()).padStart(2, "0");
var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
var yyyy = today.getFullYear();

today = yyyy + "-" + mm + "-" + dd;
var str = today;

window.onload = function () {
  document.getElementById("MaxDate").value = localStorage.getItem("DatePicker");
  // if (document.getElementById("MaxDate").value === null) {
  //   str = today;
  // } else str = document.getElementById("MaxDate").value;
  if (localStorage.getItem("DatePicker") === null) {
    str = today;
  } else str = localStorage.getItem("DatePicker");
  console.log(str);
};

const state = {
  // variable to hold the graphql query response
  response: null,
  // array that will hold the transformed response, in form of rows
  rows: [],
  //array to store the row data
  applications: [],
  // array to store the table's columns key and label
  columns: [
    {
      key: "displayName",
      header: "IT Component",
    },

    {
      key: "relatedApplications",
      header: "Applications",
    },

    {
      key: "relatedTechnicalStacks",
      header: "Technical Stacks",
    },
  ],

  // variable to hold the computed average completion ratio for all factsheets
  avgCompletion: "",
};

const methods = {
  async initializeReport() {
    await lx.init();
    await lx.ready({});
  },

  async fetchGraphQLData() {
    //GraphQL query that fetches data and return a JSON object, go to LeanIX->Administration->Tools->GraphQL to write your own queries
    const query = `
    {
      allFactSheets(filter: {facetFilters:[{facetKey:"FactSheetTypes",operator:OR,keys:["ITComponent"]},
      {facetKey:"lifecycle",operator:OR,keys:["endOfLife", "phaseOut"],
        dateFilter:{type:RANGE_STARTS,from:"1993-06-15",to:"${str}"} } ] }) {
        totalCount
        edges {
          node {
            displayName
            id
            type
            ... on ITComponent {
              lifecycle {
                phases {
                  phase
                  startDate
                }
              }
              relITComponentToTechnologyStack {
                totalCount
                edges {
                  node {
                    id
                    factSheet {
                      name
                      displayName
                    }
                  }
                }
              }
              relITComponentToApplication {
                totalCount
                edges {
                  node {
                    id
                    factSheet {
                      name
                      displayName
                      type
                      updatedAt
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `;
    lx.showSpinner();
    try {
      this.response = await lx.executeGraphQL(query);
      console.log(query);
      this.mapResponseToRows();
    } finally {
      lx.hideSpinner();
    }
  },

  // Function that updates the data when the Update button is clicked
  async updateData() {
    str = document.getElementById("MaxDate").value;
    await this.initializeReport();
    this.fetchGraphQLData();

    localStorage.setItem(
      "DatePicker",
      document.getElementById("MaxDate").value
    );
    location.reload();
  },

  exportToXLSX(columns, rows) {
    lx.showSpinner();
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Applications");
    worksheet.columns = columns;
    worksheet.addRows(rows);

    return workbook.xlsx

      .writeBuffer()
      .then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, "document.xlsx");
        lx.hideSpinner();
      })
      .catch((err) => console.error("error while exporting to excel", err));
  },

  mapResponseToRows() {
    if (this.response === null) return;
    this.rows = this.response.allFactSheets.edges.map((edge) => {
      let {
        id,
        type,
        displayName,
        lifecycle,
        relITComponentToTechnologyStack,
        relITComponentToApplication,
      } = edge.node;

      // Link the IT Component Display Name
      if (API_TOKEN === "qnY8AWkqYJMdzU6nA7LPE5TcbR2D4g3q6LyyCghW") {
        displayName =
          '<u><a href="https://teranet.leanix.net/TeranetSandbox/factsheet/' +
          type +
          "/" +
          id +
          '" style="color:blue" target="_blank">' +
          displayName +
          "</a><u>";
      } else {
        displayName =
          '<u><a href="https://teranet.leanix.net/TeranetProduction/factsheet/' +
          type +
          "/" +
          id +
          '" style="color:blue" target="_blank">' +
          displayName +
          "</a><u>";
      }

      // Number of completed children ITComponent Factsheets
      var relatedTechnicalStacks = relITComponentToTechnologyStack.edges.map(
        (edge) => edge.node.factSheet.name
      );

      // Number of completed children ITComponent Factsheets
      var relatedApplications = relITComponentToApplication.edges.map(
        (edge) => edge.node.factSheet.name
      );

      return {
        displayName,
        lifecycle,
        relatedApplications,
        relatedTechnicalStacks,
      };
    });
    console.log(this.rows);

    this.computeTableColumns(); // <-- call the computeTableColumns method here!
  },

  computeTableColumns() {
    const columnKeys = ["displayName", "lifecycle", "relatedTechnicalStacks"];
    this.columns = columnKeys.map((key) => ({
      key,
      label: lx.translateField("Application", key),
    }));
  },
};

window.initializeContext = () => {
  return {
    ...state,
    ...methods,
  };
};
