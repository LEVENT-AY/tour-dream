import ImageWithBasePath from "../../core/common/imageWithBasePath";

const DeliverySection = () => {
  return (
    <>
      <section className="section how-it-works-sec">
        <div className="container">
          <div className="section-header-eight wow fadeInUp">
            <h2>
              How It{" "}
              <ImageWithBasePath
                src="./assets/img/bg/heading-bg-03.png"
                alt="img"
              />{" "}
              Works
            </h2>
            <p className="text-muted">
              Getting started with DreamsTour is simple
            </p>
          </div>
          <div className="row row-gap-4">
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="why-choose-item w-100">
                <span className="avatar avatar-xl bg-primary rounded-circle flex-shrink-0 mb-3">
                  <i className="isax isax-search-normal-1 fs-24" />
                </span>
                <div className="text-white mb-2 home-eight-title">
                  1. Explore Services
                </div>
                <p className="mb-0 text-white">
                  Browse cruises, bus trips, visa support, and local guides
                  across Tunisia. Find what suits your travel needs.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="why-choose-item w-100">
                <span className="avatar avatar-xl bg-info rounded-circle flex-shrink-0 mb-3">
                  <i className="isax isax-message-text-1 fs-24" />
                </span>
                <div className="text-white mb-2 home-eight-title">
                  2. Send a Request
                </div>
                <p className="mb-0 text-white">
                  Fill out a simple request form on any service page. No online
                  payment needed — just tell us what you are looking for.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="why-choose-item w-100">
                <span className="avatar avatar-xl bg-cyan rounded-circle flex-shrink-0 mb-3">
                  <i className="isax isax-profile-tick fs-24" />
                </span>
                <div className="text-white mb-2 home-eight-title">
                  3. Team Contacts You
                </div>
                <p className="mb-0 text-white">
                  Our team reviews your request and reaches out personally to
                  discuss options, answer questions, and refine your plan.
                </p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="why-choose-item w-100">
                <span className="avatar avatar-xl bg-teal rounded-circle flex-shrink-0 mb-3">
                  <i className="isax isax-calendar-tick fs-24" />
                </span>
                <div className="text-white mb-2 home-eight-title">
                  4. Confirm Details
                </div>
                <p className="mb-0 text-white">
                  Once everything is clear, confirm your booking details with
                  our team. We handle the rest so you can enjoy your trip.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DeliverySection;
