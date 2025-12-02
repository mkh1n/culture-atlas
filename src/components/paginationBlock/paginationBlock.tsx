import ReactPaginate from 'react-paginate';

export default function PaginationBlock({props}) {

  const pagginationHandler = (page) => {
          const currentPath = props.router.pathname;
          const currentQuery = { ...props.router.query };
          currentQuery.page = page.selected + 1;
  
          props.router.push({
              pathname: currentPath,
              query: currentQuery,
          });
  
      };

    return <ReactPaginate
                previousLabel={'previous'}
                nextLabel={'next'}
                breakLabel={'...'}
                breakClassName={'break-me'}
                activeClassName={'active'}
                containerClassName={'pagination'}
                initialPage={props.currentPage - 1}
                pageCount={props.pageCount} //page count
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={pagginationHandler}
            />
          }