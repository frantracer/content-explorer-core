module.exports = {
  getAllContentmarksByUser: function (user) {
    contentmarks = [
      {
        id: "1",
        name: "contentmark_1",
        resources: [
          {
            name: "",
            type: "youtube",
            link: "",
            info: {
              lastUpdate: ""
            },
            feeds: [
              {
                name: "feed1",
                link: ""
              }
            ]
          }
        ]
      }
    ];
    return contentmarks;
  }
}
