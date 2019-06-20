module.exports = {
  getAllContentmarksByUser: function (user, callback) {
    contentmarks = [
      {
        id: "1",
        name: "Videogames",
        resources: [
          {
            name: "DayoScript",
            type: "youtube",
            link: "https://www.youtube.com/channel/UCVBkwO6Ok1De0UfNZdo7-Ag",
            info: {
              lastUpdate: ""
            },
            feeds: [
              {
                name: "¿Importa la dificultad en el videojuego? - Post Script",
                link: "https://www.youtube.com/embed/rnglNZZGh-s"
              }
            ]
          },
          {
            name: "Pazos64",
            type: "youtube",
            link: "https://www.youtube.com/channel/UCVj_RIAE1KGK_tM-iJtb_xg",
            info: {
              lastUpdate: ""
            },
            feeds: [
              {
                name: "Cuidao Ahí... Observation",
                link: "https://www.youtube.com/embed/qc80mRwsPc0"
              }
            ]
          }
        ]
      },
      {
        id: "2",
        name: "Physics",
        resources: [
          {
            name: "QuantumFracture",
            type: "youtube",
            link: "https://www.youtube.com/channel/UCbdSYaPD-lr1kW27UJuk8Pw",
            info: {
              lastUpdate: ""
            },
            feeds: [
              {
                name: "La Física Cuántica de Avengers Endgame",
                link: "https://www.youtube.com/embed/ca1_rbfQMts"
              }
            ]
          }
        ]
      },
      {
        id: "3",
        name: "Music",
        resources: [
          {
            name: "PostmodernJukebox",
            type: "youtube",
            link: "https://www.youtube.com/channel/UCORIeT1hk6tYBuntEXsguLg",
            info: {
              lastUpdate: ""
            },
            feeds: [
              {
                name: "I Don't Want To Miss A Thing - Aerosmith (1920s Brass Band Cover) ft. Sara Niemietz",
                link: "https://www.youtube.com/embed/9iDncS9-2vI"
              }
            ]
          }
        ]
      }
    ];

    callback(null, contentmarks);
  }
}
