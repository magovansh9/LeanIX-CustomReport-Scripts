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
      width: 10,
    },
    {
      key: "completion",
      header: "Completion",
      width: 60,
    },

    {
      key: "subscriptions",
      header: "Subscriptions",
      width: 10,
    },

    {
      key: "totalCount",
      header: "All Factsheets",
      width: 20,
    },

    {
      key: "completeFactSheets",
      header: "Complete Factsheets",
      width: 20,
    },

    {
      key: "comments",
      header: "Comments",
      width: 20,
    },
    {
      key: "displayNameITComponents",
      header: "IT Components",
      width: 20,
    },

    {
      key: "relTechnologyStackToITComponent",
      header: "Last Updated Date",
      width: 20,
    },

    {
      key: "id",
      header: "FactSheet Link",
      width: 20,
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
    // to be implemented...
    const query = `
    {
      allFactSheets(filter: {facetFilters: [{facetKey: "FactSheetTypes", operator: OR, keys: ["TechnicalStack"]}, {facetKey: "6b7a5b67-acbd-41b4-a4b7-de6e9f83cd98", operator: OR, keys: ["9ebb9fe8-064b-4550-b92f-dd642b6f56f6"]}, {facetKey: "lifecycle", keys: "__any__", dateFilter: {type: RANGE, from: "2021-01-01", to: "2018-03-31"}}]}) {
        totalCount
        edges {
          node {
            displayName
            id
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
    // var subscription = this.response.allFactSheets.edges.subscriptions.edges
    this.rows = this.response.allFactSheets.edges.map((edge) => {
      let {
        displayName,
        completion,
        subscriptions,
        comments,
        relTechnologyStackToITComponent,
        id,
      } = edge.node;

      //Open FactSheet on the same Page

      //Factsheet id manipulation
      // id =
      //   "https://teranet.leanix.net/TeranetSandbox/factsheet/TechnicalStack/" +
      //   id;

      // //Factsheet Link
      // const FactSheetLink = "Go to FactSheet";
      // id = FactSheetLink.link(id);

      //Open FactSheet on a new page
      id =
        '<u><a href="https://teranet.leanix.net/TeranetSandbox/factsheet/TechnicalStack/' +
        id +
        '" target="_blank" style="color: blue">Go To FactSheet</a></u>';

      //totalCount
      const totalCount = relTechnologyStackToITComponent.totalCount;
      const completeFactSheets = Math.floor(
        (completion.percentage / 100) * totalCount
      );

      //Completion
      completion = completion.percentage + "%";

      //Subscribed Users
      subscriptions = subscriptions.edges.map(
        (edge) => edge.node.user.displayName
      );

      //Comments (the following line will produce the correct output if GraphQL returns comments for multiple factsheets)
      comments = comments.edges.map((edge) => edge.node.message);

      // DisplayName of IT Component Factsheets
      var displayNameITComponents = relTechnologyStackToITComponent.edges.map(
        (edge) => edge.node.factSheet.displayName
      );

      displayNameITComponents = displayNameITComponents.join(", ");

      // Get LastUpdatedDate of all the IT Component Factsheets
      relTechnologyStackToITComponent =
        relTechnologyStackToITComponent.edges.map(
          (edge) => edge.node.factSheet.updatedAt
        );
      relTechnologyStackToITComponent.sort(function (a, b) {
        return a > b ? -1 : a < b ? 1 : 0;
      });
      relTechnologyStackToITComponent = relTechnologyStackToITComponent[0];
      var strMaxDate = String(relTechnologyStackToITComponent);
      relTechnologyStackToITComponent = strMaxDate.substr(0, 10);

      // relTechnologyStackToITComponent.reduce((a, b) => (a > b ? a : b), []);

      // var maxDate = relTechnologyStackToITComponent;
      // maxDate = relTechnologyStackToITComponent.reduce((a, b) =>
      //   a > b ? a : b
      // );
      // const maxDate = relTechnologyStackToITComponent.reduce((a, b) =>
      //   a > b ? a : b
      // );
      // var maxDateArray = [];
      // maxDateArray.push(maxDate);
      // console.log(maxDateArray);

      return {
        displayName,
        completion,
        subscriptions,
        comments,
        relTechnologyStackToITComponent,
        displayNameITComponents,
        totalCount,
        completeFactSheets,
        id,
      };
    });

    // Get multiple Updated Dates
    var maxDate = this.rows.reduce(
      (accumulator, row) =>
        accumulator > row.relTechnologyStackToITComponent
          ? accumulator
          : row.relTechnologyStackToITComponent,
      0
    );

    // Manipulate maxDate to get Latest Updated Date
    var strMaxDate = String(maxDate);
    this.lastUpdatedDate = strMaxDate.substr(0, 10);

    this.computeTableColumns(); // <-- call the computeTableColumns method here!

    // const relTechnologyStackToITComponent =
    //   this.rows.relTechnologyStackToITComponent;
    // console.log(relTechnologyStackToITComponent[0].node.factSheet.updatedAt);
  },
  computeTableColumns() {
    const columnKeys = [
      "displayName",
      "completion",
      "totalCount",
      "completeFactSheets",
      "subscriptions",
      "comments",
      "displayNameITComponents",
      "relTechnologyStackToITComponent",
      "id",
    ];
    this.columns = columnKeys.map((key) => ({
      key,
      label: lx.translateField("Application", key),
    }));
  },
  exportToXLSX(columns, applications) {
    lx.showSpinner();
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Applications");
    worksheet.columns = columns;
    worksheet.addRows(applications);
    return workbook.xlsx
      .writeBuffer()
      .then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, "TLRStatusReport.xlsx");
        lx.hideSpinner();
      })
      .catch((err) => console.error("error while exporting to excel", err));
  },
};

window.initializeContext = () => {
  return {
    ...state,
    ...methods,
  };
};

// QUERYING DATA END

// import "alpinejs";
// import "@leanix/reporting";
// import "./assets/tailwind.css";
// import Excel from "exceljs";
// import { saveAs } from "file-saver";

// const state = {
//   baseUrl: "",
//   applications: [],
//   columns: [
//     {
//       key: "id",
//       header: "ID",
//       width: 40,
//     },
//     {
//       key: "name",
//       header: "Name",
//       width: 60,
//     },
//     {
//       key: "tagCount",
//       header: "Tag Count",
//       width: 10,
//     },
//     {
//       key: "tags",
//       header: "Tags",
//       width: 100,
//     },

//     {
//       key: "comments",
//       header: "Comments",
//       width: 100,
//     },
//   ],
// };

// const methods = {
//   // to be called upon report initialization
//   initializeReport() {
//     return lx.init().then((setup) => {
//       this.baseUrl = setup.settings.baseUrl;
//       const config = {
//         allowTableView: false,
//         facets: [
//           {
//             fixedFactSheetType: "TechnicalStack",
//             attributes: ["name", "tags {name tagGroup {name}}"],
//             callback: (applications) =>
//               (this.applications = applications.map((application) => {
//                 let { tags = [] } = application;
//                 const tagCount = tags.length;
//                 tags = tags

//                   .map((tag) => {
//                     const { name, tagGroup = null } = tag;
//                     let labelPrefix = "";
//                     if (
//                       tagGroup == "6b7a5b67-acbd-41b4-a4b7-de6e9f83cd98" &&
//                       id === "9ebb9fe8-064b-4550-b92f-dd642b6f56f6" &&
//                       name === "TLR"
//                     )
//                       labelPrefix = `${tagGroup.name} - `;
//                     return `${labelPrefix}${name}`;
//                   })
//                   .join(", ");
//                 return { ...application, tags, tagCount };
//               })),
//           },
//         ],
//       };
//       return lx.ready(config);
//     });
//   },
//   exportToXLSX(columns, applications) {
//     lx.showSpinner();
//     const workbook = new Excel.Workbook();
//     const worksheet = workbook.addWorksheet("Applications");
//     worksheet.columns = columns;
//     worksheet.addRows(applications);
//     return workbook.xlsx
//       .writeBuffer()
//       .then((buffer) => {
//         const blob = new Blob([buffer], {
//           type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         });
//         saveAs(blob, "TLRStatusReport.xlsx");
//         lx.hideSpinner();
//       })
//       .catch((err) => console.error("error while exporting to excel", err));
//   },
// };

// window.init = () => {
//   return {
//     ...state,
//     ...methods,
//   };
// };

// TABLE REPORT END
