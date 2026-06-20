import { fetchChalets } from '../../../core/services/firebaseServices';
import LodgingGridPage from '../../lodging/LodgingGridPage';
import { all_routes } from '../../router/all_routes';

const ChaletGrid = () => (
  <LodgingGridPage
    listingType="chalet"
    title="Chalets"
    route={all_routes.chaletGrid}
    detailsRoute={all_routes.chaletDetails}
    fetchListings={fetchChalets}
  />
);

export default ChaletGrid;
