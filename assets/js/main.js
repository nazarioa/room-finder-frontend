'use strict';
import '../scss/main.scss';
import Rx from 'rxjs/Rx';

(function (OUTSIDE) {
  const API_BASE = 'http://api-roomfinder.dev.niztech.com';
  const tplPersonListItem = document.querySelector('#tpl-person-list-item');
  const tplRoomListItem = document.querySelector('#tpl-room-list-item');

  const selectedResult = document.querySelector('.selected-result');

  const inpSearch = document.querySelector('.inp.inp-search');

  const SelectedResult = {
    room_id: null,
    building_id: null,
    map_id: null,
    show: false,

    populateRoomData: function (roomId) {
      this.room_id = roomId;
      const getRoomData = fetch(`${API_BASE}/Rooms/view/${this.room_id}`)
        .then(response => response.json())
        .then(data => data.room)
        .then(room => {
          const roomDetailsDisplay = document.querySelector('.room-details');
          roomDetailsDisplay.querySelector('.floor.value').innerHTML = room.floor.name;
          roomDetailsDisplay.querySelector('.room.value').innerHTML = room.name;
          roomDetailsDisplay.querySelector('.roomcode.value').innerHTML = room.code;
          this.populateBuildingData(room.floor.building_id);
          const imageCoordiantes = (room.image_coordinates && (room.image_coordinates.length > 0)) ? JSON.parse(room.image_coordinates) : [];
          this.drawMapData(room.floor.map_id, imageCoordiantes);
        });
    },

    populateBuildingData: function (buildingId) {
      this.building_id = buildingId;
      const getBuildingData = fetch(`${API_BASE}/Buildings/view/${this.building_id}`)
        .then(response => response.json())
        .then(data => data.building)
        .then(building => {
          const buildingDetailsDisplay = document.querySelector('.room-details');
          buildingDetailsDisplay.querySelector('.building-name .value').innerHTML = building.name;
          buildingDetailsDisplay.querySelector('.building-address .address.value').innerHTML = building.address;
          buildingDetailsDisplay.querySelector('.building-address .city.value').innerHTML = building.city;
          buildingDetailsDisplay.querySelector('.building-address .state.value').innerHTML = building.state;
        });
    },

    drawMapData: function (mapId, roomCoordinates) {
      this.map_id = mapId;
      const resultMapCanvas = document.querySelector('#map-canvas');
      const ctx = resultMapCanvas.getContext('2d');

      const getMapData = fetch(`${API_BASE}/Maps/view/${this.map_id}`)
        .then(response => response.json())
        .then(data => data.map)
        .then(map => {
          const base_image = new Image();
          base_image.src = map.image_url;
          return new Promise((resolve, reject) => {
            base_image.onload = () => resolve(base_image);
            base_image.onerror = (event) => reject(event);
          });
        })
        .then(image => {
          ctx.clearRect(0, 0, resultMapCanvas.width, resultMapCanvas.height);
          ctx.drawImage(image, 0, 0);
        })
        .then(() => {
          if (Array.isArray(roomCoordinates) && roomCoordinates.length > 0) {
            ctx.fillStyle = 'rgba(240, 226, 0, 0.5)';
            ctx.beginPath();
            roomCoordinates.forEach((point, index) => {
              if (index === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            ctx.closePath();
            ctx.fill();
          }
        })
        .catch(error => console.log(error));
    },

    render: function () {
      if (!this.show) {
        selectedResult.classList.add('hidden');
      } else if (this.room_id) {
        selectedResult.classList.remove('hidden');
      } else {
        selectedResult.classList.add('hidden');
        // Maybe remove hidden from an error message here
      }
    }
  };

  const ResultsList = {
    searchResultList: document.querySelector('.search-results .search-results-list'),

    list: [],

    discoverType: function (item) {
      if (item.hasOwnProperty('last_name')) {
        return 'person';
      }

      if (item.hasOwnProperty('floor_id')) {
        return 'room';
      }

      return 'unknown';
    },

    registerLiClick: function () {
      this.searchResultList.addEventListener('click', event => {
        const selectedRoomId = event.srcElement.closest('.list-item').dataset.roomId;
        if (selectedRoomId) {
          SelectedResult.populateRoomData(selectedRoomId);
          SelectedResult.show = true;
        } else {
          // Maybe show an error that the thing we clicked on does not have a roomId.
          SelectedResult.show = false;
        }
        SelectedResult.render();
      });
    },

    render: function () {
      this.searchResultList.innerHTML = '';

      this.list.forEach(item => {
        const type = this.discoverType(item);

        let row = null;

        if (type === 'person') {
          row = document.importNode(tplPersonListItem.content, true);
          row.querySelector('.person-list-item.list-item').dataset.personId = item.id;
          row.querySelector('.first-name.value').innerHTML = item.first_name;
          row.querySelector('.last-name.value').innerHTML = item.last_name;
          row.querySelector('.email.value').innerHTML = item.email;
          row.querySelector('.email.value').setAttribute('href', `mailto:${item.email}`);
        }

        if (type === 'room') {
          row = document.importNode(tplRoomListItem.content, true);
          row.querySelector('.room-list-item.list-item').dataset.roomId = item.id;
          row.querySelector('.room-detail .room.value').innerHTML = item.name || '';
          row.querySelector('.building-detail .floor.value').innerHTML = item.Floors.name || '';
          row.querySelector('.building-detail .name.value').innerHTML = item.Buildings.name || '';
        }

        if (type === 'unknown') {
          console.log('Could not find type.');
        }

        if (row) {
          this.searchResultList.appendChild(row);
        }
      });

      if (this.list.length === 1) {
        SelectedResult.populateRoomData(this.list[0].id);
        SelectedResult.show = true;
      } else {
        SelectedResult.show = false;
      }

      SelectedResult.render();
    }
  };

  // RxJS Stream - Content stream here.
  // const inputSearchObs = Rx.Observable.fromEvent(inpSearch, 'keyup');
  // const p = inputSearchObs.filter(() => inpSearch.value.length > 5).subscribe(val => console.log(val));
  // console.log(p);

  // RxJS Stream - Content stream here too?

  inpSearch.addEventListener('keyup', event => {

    const inputSearchString = inpSearch.value;
    if (inputSearchString.length > 2) {
      const userFuzzyResultPromise = fetch(`${API_BASE}/Users/search/${inputSearchString}`)
        .then(response => response.json())
        .then(data => data.result);

      const roomFuzzyResultPromise = fetch(`${API_BASE}/Rooms/search/${inputSearchString}`)
        .then(response => response.json())
        .then(data => data.result);

      const finalResultResultPromise = Promise
        .all([roomFuzzyResultPromise, userFuzzyResultPromise]);

      finalResultResultPromise
        .then(data => data.reduce((accumulation, result) => accumulation.concat(result), []))
        .then(results => ResultsList.list = results)
        .then(() => ResultsList.render())
        .catch(error => console.log(error));
    }

  });

  ResultsList.render();
  ResultsList.registerLiClick();

})(window);