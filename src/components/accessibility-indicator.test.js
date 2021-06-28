import React from 'react';
import { shallow } from 'enzyme';
import toJson from "enzyme-to-json";
import AccessibilityIndicator from './accessibility-indicator.jsx';

const getProps = (val = 'Full') => ({
	accessibility: {
		keyboard: val,
		screen_reader: val
	}
})

describe('AccessibilityIndicator', () => {
	it('should render', () => {
		const wrapper = shallow(<AccessibilityIndicator widget={getProps()} />);
		expect(toJson(wrapper)).toMatchSnapshot();
	})

	test('changing props should change component as expected', () => {
		// Full
		let component = shallow(<AccessibilityIndicator widget={getProps()} />);
		expect(component.find('#keyboard-access-level').text()).toBe('fully supported');
		expect(component.find('#screen-reader-access-level').text()).toBe('fully supported');

		// Limited
		component = shallow(<AccessibilityIndicator widget={getProps('Limited')} />);
		expect(component.find('#keyboard-access-level').text()).toBe('partially supported');
		expect(component.find('#screen-reader-access-level').text()).toBe('partially supported');

		// None
		component = shallow(<AccessibilityIndicator widget={getProps('None')} />);
		expect(component.find('#keyboard-access-level').text()).toBe('not supported');
		expect(component.find('#screen-reader-access-level').text()).toBe('not supported');

		// Random
		component = shallow(<AccessibilityIndicator widget={getProps('ab9lw2')} />);
		expect(component.find('#keyboard-access-level').text()).toBe('not supported');
		expect(component.find('#screen-reader-access-level').text()).toBe('not supported');
	});

	it('should render correctly when props not set', () => {
		const component = shallow(<AccessibilityIndicator />);
		expect(component.find('#keyboard-access-level').text()).toBe('not supported');
		expect(component.find('#screen-reader-access-level').text()).toBe('not supported');
	});
});
