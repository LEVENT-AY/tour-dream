import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import FlightSearch from '../flightSearch';


const FlightGrid = () => {
    const breadcrumbs = [
        {
            label: 'Flight',
            active: false,
        },
        {
            label: 'Flight Grid',
            active: true,
        },
    ];

    return (
        <>
            <Breadcrumb title="Flight" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-05" />
            <div className="content">
                <div className="container">
                    <FlightSearch />

                </div>
            </div>
        </>
    )
}

export default FlightGrid;
