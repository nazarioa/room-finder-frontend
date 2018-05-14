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
    person: null,
    building: null,
    floor: null,
    selected: true,

    render: function () {

      if (this.selected) {

        if (floor && floor.image_url) {
          selectedResult.querySelector('.result-map img').setAttribute('src', 'floor.image_url');
        } else {
          selectedResult.querySelector('.result-map img').setAttribute('src', '//defualtUrl.');
        }

        searchResults.classList.remove('hidden');
      } else {
        searchResults.classList.add('hidden');
      }
    }
  };

  const ResultsList = {
    list: [],

    discoverType: function (item) {
      if (item.hasOwnProperty('last_name')) {
        return 'person';
      }

      if (item.hasOwnProperty('floor_id') && item.hasOwnProperty('has_whiteboard')) {
        return 'room';
      }

      return 'unknown';
    },

    render: function () {
      this.list.forEach(item => {
        const type = this.discoverType(item);
        const searchResultList = document.querySelector('.search-results .search-results-list');
        searchResultList.innerHTML = '';

        let row = null;

        if (type === 'person') {
          row = document.importNode(tplPersonListItem.content, true);
          row.querySelector('.first-name.value').innerHTML = item.first_name;
          row.querySelector('.last-name.value').innerHTML = item.last_name;
          row.querySelector('.email.value').setAttribute('href', `mailto:${item.email}`);
        }

        if (type === 'room') {
          console.log('Rooms!!', item);
          row = document.importNode(tplRoomListItem.content, true);
          /*
          row.querySelector('.building-address .address.value').innerHTML = 'Address';
          row.querySelector('.building-city-state .city.value').innerHTML = 'City';
          row.querySelector('.building-city-state .state.value').innerHTML = 'State';
          row.querySelector('.building-city-state .state.value').innerHTML = 'State';
          */
        }

        if(row) {
          searchResultList.appendChild(row);
        }
      });
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

})(window);