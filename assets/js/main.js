'use strict';
import '../scss/main.scss';
import Rx from 'rxjs/Rx';

(function (OUTSIDE) {
  const tplPersonListItem = document.querySelector('#tpl-person-list-item');
  const tplRoomListItem = document.querySelector('#tpl-room-list-item');

  const searchResultList = document.querySelector('.search-results-list');
  const selectedResult = document.querySelector('.selected-result');

  const inpSearch = document.querySelector('.inp.inp-search');

  // RxJS Stream - Content stream here.
  // const inputSearchObs = Rx.Observable.fromEvent(inpSearch, 'keyup');
  // const p = inputSearchObs.filter(() => inpSearch.value.length > 5).subscribe(val => console.log(val));
  // console.log(p);

  // RxJS Stream - Content stream here too?

  inpSearch.addEventListener('keyup', event => {

    const inputSearchString = inpSearch.value;
    if (inputSearchString.length > 2) {
      const userFuzzyResultPromise = fetch(`http://api.room-finder.local/Users/search/${inputSearchString}`)
        .then(response => response.json());

      const roomFuzzyResultPromise = fetch(`http://api.room-finder.local/Rooms/search/${inputSearchString}`)
        .then(response => response.json());

      const finalResultResultPromise = Promise.all([roomFuzzyResultPromise, userFuzzyResultPromise]);

      finalResultResultPromise.then(result => console.log(result))
                              .catch(error => console.log(error));
    }

  });

})(window);