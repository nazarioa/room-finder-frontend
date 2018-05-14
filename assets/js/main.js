'use strict';
import '../scss/main.scss';
import Rx from 'rxjs/Rx';

(function (OUTSIDE) {
  const tplPersonListItem = document.querySelector('#tpl-person-list-item');
  const tplRoomListItem = document.querySelector('#tpl-room-list-item');

  const searchResults = document.querySelector('.search-results');
  const searchResultList = document.querySelector('.search-results-list');

  const selectedResult = document.querySelector('.selected-result');

  const inpSearch = document.querySelector('.inp.inp-search');

  const SelectedResult = {
    item: null,
    show: false,

    render: function () {
      if (this.show) {
        if (floor && floor.image_url) {
          selectedResult.querySelector('.result-map img').setAttribute('src', 'floor.image_url');
        } else {
          selectedResult.querySelector('.result-map img').setAttribute('src', '//defualtUrl.');
        }

        selectedResult.classList.remove('hidden');
      } else {
        selectedResult.classList.add('hidden');
      }
    }
  };

  const ResultsList = {
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

    render: function () {
      const searchResultList = document.querySelector('.search-results .search-results-list');
      searchResultList.innerHTML = '';

      this.list.forEach(item => {
        const type = this.discoverType(item);

        let row = null;

        if (type === 'person') {
          row = document.importNode(tplPersonListItem.content, true);
          row.querySelector('.first-name.value').innerHTML = item.first_name;
          row.querySelector('.last-name.value').innerHTML = item.last_name;
          row.querySelector('.email.value').innerHTML = item.email;
          row.querySelector('.email.value').setAttribute('href', `mailto:${item.email}`);
        }

        if (type === 'room') {
          row = document.importNode(tplRoomListItem.content, true);
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

})(window);