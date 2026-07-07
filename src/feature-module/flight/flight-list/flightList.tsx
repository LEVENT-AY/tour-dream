import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import FlightSearch from '../flightSearch';


const FlightList = () => {
    const breadcrumbs = [
        {
            label: 'Flight',
            active: false,
        },
        {
            label: 'Flight List',
            active: true,
        },
    ];

    return (
        <>
            <Breadcrumb title="Flight" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-05" />
            <div className="content public-results-shell">
                <div className="container public-results-full-width">
                    <FlightSearch />

                </div>
            </div>
        </>
    )
}

export default FlightList
