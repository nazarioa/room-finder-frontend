'use strict';
import '../scss/main.scss';
import Rx from 'rxjs/Rx';

(function (OUTSIDE) {
  const tplPersonListItem = document.querySelector('#tpl-person-list-item');
  const tplRoomListItem = document.querySelector('#tpl-room-list-item');

  const selectedResult = document.querySelector('.selected-result');

  const inpSearch = document.querySelector('.inp.inp-search');

  const SelectedResult = {
    room_id: null,
    building_id: null,
    show: false,

    populateRoomData: function (roomId) {
      this.room_id = roomId;
      const getRoomData = fetch(`http://api.room-finder.local/Rooms/view/${this.room_id}`)
        .then(response => response.json())
        .then(data => data.room)
        .then(room => {
          console.log(room);
          const roomDetailsDisplay = document.querySelector('.room-details');
          roomDetailsDisplay.querySelector('.floor.value').innerHTML = room.floor.name;
          roomDetailsDisplay.querySelector('.room.value').innerHTML = room.name;
          roomDetailsDisplay.querySelector('.roomcode.value').innerHTML = room.code;
          this.populateBuildingData(room.floor.building_id);
        });
    },

    populateBuildingData: function (buildingId) {
      this.building_id = buildingId;
      const getBuildingData = fetch(`http://api.room-finder.local/Buildings/view/${this.building_id}`)
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
          row.querySelector('.room-detail .floor.value').innerHTML = item.Floors.name || '';
          row.querySelector('.building-detail .building-name.value').innerHTML = item.Buildings.name || '';
          row.querySelector('.building-detail .building-address.value').innerHTML = item.Buildings.address || '';
          row.querySelector('.building-detail .building-city.value').innerHTML = item.Buildings.city || '';
          row.querySelector('.building-detail .building-state.value').innerHTML = item.Buildings.state || '';
        }

        if (type === 'unknown') {
          console.log('Could not find type.');
        }

        if (row) {
          this.searchResultList.appendChild(row);
        }
      });

      if (this.list.length === 1) {
        SelectedResult.item = this.list[0];
        SelectedResult.show = true;
      } else if (this.list.length === 0) {
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
      const userFuzzyResultPromise = fetch(`http://api.room-finder.local/Users/search/${inputSearchString}`)
        .then(response => response.json())
        .then(data => data.result);

      const roomFuzzyResultPromise = fetch(`http://api.room-finder.local/Rooms/search/${inputSearchString}`)
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