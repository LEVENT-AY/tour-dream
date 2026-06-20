import { fetchResorts } from '../../../core/services/firebaseServices';
import LodgingGridPage from '../../lodging/LodgingGridPage';
import { all_routes } from '../../router/all_routes';

const ResortGrid = () => (
  <LodgingGridPage
    listingType="resort"
    title="Resorts"
    route={all_routes.resortGrid}
    detailsRoute={all_routes.resortDetails}
    fetchListings={fetchResorts}
  />
);

export default ResortGrid;
