//importing alpine js, a javascript framework, to implement extended functionality such as interlinking html and js efficiently
import "alpinejs";
import "@leanix/reporting";
import "./assets/tailwind.css";

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
      header: "Display Name",
    },

    {
      key: "completion",
      header: "Completion",
    },

    {
      key: "subscriptions",
      header: "Subscriptions",
    },

    {
      key: "totalCount",
      header: "All Factsheets",
    },

    {
      key: "CompleteFactsheets",
      header: "Complete Factsheets",
    },

    {
      key: "comments",
      header: "Comments",
    },
    {
      key: "displayNameITComponents",
      header: "IT Components",
    },

    {
      key: "lastUpdatedDate",
      header: "Last Updated Date",
    },
  ],

  // variable to hold the computed average completion ratio for all factsheets
  avgCompletion: "n/a",

  // variable to hold last updated date
  lastUpdatedDate: "n/a",
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
      allFactSheets(filter: {facetFilters: [{facetKey: "FactSheetTypes", operator: OR, keys: ["TechnicalStack"]}, {facetKey: "6b7a5b67-acbd-41b4-a4b7-de6e9f83cd98", operator: OR, keys: ["9ebb9fe8-064b-4550-b92f-dd642b6f56f6"]}, {facetKey: "lifecycle", keys: "__any__", dateFilter: {type: RANGE, from: "2021-01-01", to: "2018-03-31"}}]}) {
        totalCount
        edges {
          node {
            displayName
            id
            type
            comments {
              edges {
                node {
                  message
                }
              }
            }
            completion {
              percentage
            }
            ... on TechnicalStack {
              tags {
                name
                id
              }
              subscriptions {
                edges {
                  node {
                    user {
                      displayName
                      role
                    }
                  }
                }
              }
              relTechnologyStackToITComponent {
                totalCount
                edges {
                  node {
                    id
                    factSheet {
                      name
                      displayName
                      type
                      updatedAt
                      qualitySeal
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
      this.mapResponseToRows();
    } finally {
      lx.hideSpinner();
    }
  },
  mapResponseToRows() {
    if (this.response === null) return;
    this.rows = this.response.allFactSheets.edges.map((edge) => {
      let {
        displayName,
        completion,
        type,
        subscriptions,
        comments,
        relTechnologyStackToITComponent,
        id,
      } = edge.node;

      // Open FactSheet on a new page

      // Utilizes a common part of the URL, and appends factsheet type and id to get unique links for every FactSheet
      // The link is switched based on the workspace name embedded in the URL

      const urlName = window.location.host;
      const pathname = window.location.pathname;
      const ws = "Sandbox";
      if (pathname.includes(ws)) {
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
      // displayName =
      //   '<u><a href="' +
      //   window.location.origin +
      //   "/factsheet/" +
      //   type +
      //   "/" +
      //   id +
      //   '" style="color:blue" target="_blank">' +
      //   displayName +
      //   "</a></u>";
      // console.log(window.location.origin);

      // Total Number of children ITComponent FactSheets
      const totalCount = relTechnologyStackToITComponent.totalCount;

      // Number of completed children ITComponent Factsheets
      var qualitySealITComponentFactsheet =
        relTechnologyStackToITComponent.edges.map(
          (edge) => edge.node.factSheet.qualitySeal
        );

      const CompleteFactsheets = qualitySealITComponentFactsheet.filter(
        function (element) {
          return element == "APPROVED";
        }
      ).length;

      //Completion Percentage
      completion =
        Math.floor(
          ((parseFloat(CompleteFactsheets) * 1.0) / parseFloat(totalCount)) *
            100
        ) + "%";

      if (totalCount == 0) {
        completion = "n/a";
      }

      //Subscribed Users
      subscriptions = subscriptions.edges.map(
        (edge) => edge.node.user.displayName
      );

      //Comments
      //At the time of writing, changes in comments are not reflected every time the query is called, LeanIX needs to make a backend call manually in order to reflect any updates
      comments = comments.edges.map((edge) => edge.node.message);

      // DisplayName of IT Component Factsheets
      var displayNameITComponents = relTechnologyStackToITComponent.edges.map(
        (edge) => edge.node.factSheet.displayName
      );
      displayNameITComponents = displayNameITComponents.join(", ");

      // Get the Latest Update Date for all the IT Component Factsheets and display it for each Technical Stack FactSheet

      // // Returns an array of ISO 8601 dates
      var lastUpdatedDate = relTechnologyStackToITComponent.edges.map(
        (edge) => edge.node.factSheet.updatedAt
      );

      // // Sort in a descending Order
      lastUpdatedDate.sort(function (a, b) {
        return a > b ? -1 : a < b ? 1 : 0;
      });

      // // Display the ISO 8601 date in a normal form by using a substring of the whole string
      lastUpdatedDate = lastUpdatedDate[0];
      var strMaxDate = String(lastUpdatedDate);
      var date = new Date(strMaxDate);
      var day = date.getDate();
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var months = [
        "January",
        "Februray",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      if (totalCount == 0) {
        lastUpdatedDate = "n/a";
      } else {
        lastUpdatedDate = months[month - 1] + " " + day + " " + year;
      }

      // NOTE: To optimize and replace the logic in the code above, one may use the Javascript "reduce" function

      return {
        displayName,
        completion,
        subscriptions,
        comments,
        lastUpdatedDate,
        displayNameITComponents,
        totalCount,
        qualitySealITComponentFactsheet,
        CompleteFactsheets,
      };
    });

    this.computeTableColumns(); // <-- call the computeTableColumns method here!
  },

  computeTableColumns() {
    const columnKeys = [
      "displayName",
      "completion",
      "totalCount",
      "CompleteFactsheets",
      "subscriptions",
      "comments",
      "displayNameITComponents",
      "lastUpdatedDate",
    ];
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
